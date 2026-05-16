# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Docker deployment

Build the production image with a Doppler service token:

```sh
docker build --build-arg DOPPER_SECRET="$DOPPER_SECRET" -t zyroautomation-frontend .
```

The Dockerfile also accepts the official Doppler variable name:

```sh
docker build --build-arg DOPPLER_TOKEN="$DOPPLER_TOKEN" -t zyroautomation-frontend .
```

Run the built image:

```sh
docker run --rm --name zyroautomation-frontend-app -p 8080:80 zyroautomation-frontend
```

Vite reads `VITE_*` values at build time, so keep `VITE_API_URL` and any other frontend environment values in the Doppler config used by the service token. Build args can appear in Docker build metadata, so use your CI/CD platform's secret handling wherever possible.
