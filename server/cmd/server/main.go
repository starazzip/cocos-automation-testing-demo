package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/app"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/store/sqlite"
	slotws "github.com/starazzip/cocos-automation-testing-demo/server/internal/transport/ws"
)

func main() {
	dbPath := os.Getenv("SLOT_DB_PATH")
	if dbPath == "" {
		dbPath = "slot.db"
	}

	store, err := sqlite.Open(dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()

	service := app.NewService(store)
	config := domain.DefaultConfig()
	if err := service.Init(context.Background(), config); err != nil {
		log.Fatal(err)
	}

	balance, err := service.Balance(context.Background(), config.LocalPlayer)
	if err != nil {
		log.Fatal(err)
	}

	addr := os.Getenv("SLOT_ADDR")
	if addr == "" {
		addr = ":8080"
	}
	testMode := enabled(os.Getenv("SLOT_TEST_MODE"))

	mux := http.NewServeMux()
	mux.Handle("/ws", slotws.NewHandler(service, testMode))
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	fmt.Printf("initialized %s with balance %d at %s\n", config.LocalPlayer, balance, dbPath)
	fmt.Printf("listening on %s, websocket /ws, test mode %t\n", addr, testMode)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func enabled(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}
