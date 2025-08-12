up:
	docker compose up --build
down:
	docker compose down
migrate:
	docker compose exec api npm run prisma:migrate
seed:
	docker compose exec api node scripts/seed.cjs
logs:
	docker compose logs -f
