.PHONY: deploy-build-frontend
deploy-build-frontend:
	docker buildx build --platform linux/amd64 -t saidmagomedov/frontend-app:latest -f Dockerfile . --push