FROM node:24-bookworm-slim AS console
WORKDIR /src/web
COPY web/package*.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM golang:1.26.10-bookworm AS api
WORKDIR /src
COPY go.mod go.sum ./
COPY cmd/ ./cmd/
ENV GOFLAGS=-mod=readonly
RUN test -z "$(gofmt -l cmd)" && go vet ./... && go test ./...
RUN CGO_ENABLED=0 go build -trimpath -o /out/blend-api ./cmd/blend-api

FROM debian:bookworm-slim
LABEL org.opencontainers.image.title="Blend appliance"
WORKDIR /opt/blend
COPY --from=api /out/blend-api /usr/local/bin/blend-api
COPY --from=console /src/web/dist ./web/dist
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/blend-api"]
