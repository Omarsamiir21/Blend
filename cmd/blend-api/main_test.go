package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthRoutes(t *testing.T) {
	for _, tc := range []struct {
		name     string
		path     string
		dbErr    error
		wantCode int
		wantBody string
	}{
		{"liveness independent of database", "/api/v1/system/live", errors.New("secret"), 200, `{"status":"live"}`},
		{"ready", "/api/v1/system/health", nil, 200, `{"status":"ready","database":"ready"}`},
		{"failure redacted", "/api/v1/system/health", errors.New("secret"), 503, `{"status":"unavailable","database":"unavailable"}`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			handler := routes(func(context.Context) error { return tc.dbErr }, t.TempDir())
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, tc.path, nil))
			if response.Code != tc.wantCode || strings.TrimSpace(response.Body.String()) != tc.wantBody {
				t.Fatalf("got %d %q, want %d %q", response.Code, response.Body.String(), tc.wantCode, tc.wantBody)
			}
		})
	}
}
