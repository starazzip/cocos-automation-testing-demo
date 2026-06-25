package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/starazzip/cocos-automation-testing-demo/server/internal/app"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/domain"
	"github.com/starazzip/cocos-automation-testing-demo/server/internal/store/sqlite"
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
	fmt.Printf("initialized %s with balance %d at %s\n", config.LocalPlayer, balance, dbPath)
}
