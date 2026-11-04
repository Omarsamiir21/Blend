package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type health struct {
	Status   string `json:"status"`
	Database string `json:"database,omitempty"`
}

func writeHealth(w http.ResponseWriter, code int, body health) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}

func routes(ready func(context.Context) error, webRoot string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/system/live", func(w http.ResponseWriter, r *http.Request) {
		writeHealth(w, http.StatusOK, health{Status: "live"})
	})
	mux.HandleFunc("GET /api/v1/system/health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := ready(ctx); err != nil {
			writeHealth(w, http.StatusServiceUnavailable, health{Status: "unavailable", Database: "unavailable"})
			return
		}
		writeHealth(w, http.StatusOK, health{Status: "ready", Database: "ready"})
	})
	files := http.FileServer(http.Dir(webRoot))
	mux.Handle("GET /assets/", files)
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		switch path.Clean(r.URL.Path) {
		case "/", "/labs", "/machines", "/captures", "/deployments", "/recovery", "/infrastructure", "/settings":
			http.ServeFile(w, r, webRoot+"/index.html")
		default:
			http.NotFound(w, r)
		}
	})
	return mux
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return errors.New("DATABASE_URL is required")
	}
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return errors.New("invalid database configuration")
	}
	if file := os.Getenv("BLEND_DB_PASSWORD_FILE"); file != "" {
		password, err := os.ReadFile(file)
		if err != nil {
			return errors.New("cannot read the database password file")
		}
		config.ConnConfig.Password = strings.TrimRight(string(password), "\r\n")
	}
	return serve(ctx, config)
}

func serve(ctx context.Context, config *pgxpool.Config) error {
	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return errors.New("cannot initialize the database pool")
	}
	defer db.Close()

	ready := func(ctx context.Context) error {
		var applied bool
		err := db.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM blend_schema_migrations WHERE version = 1)").Scan(&applied)
		if err != nil {
			return err
		}
		if !applied {
			return errors.New("foundation migration is missing")
		}
		return nil
	}

	addr := os.Getenv("BLEND_HTTP_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	server := &http.Server{
		Addr:              addr,
		Handler:           routes(ready, "web/dist"),
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	done := make(chan error, 1)
	go func() { done <- server.ListenAndServe() }()
	select {
	case err := <-done:
		return err
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return server.Shutdown(shutdown)
	}
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}
