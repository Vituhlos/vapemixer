# Unraid Template

This folder contains the Unraid Community Applications template for VapeMixer:

- `vapemixer.xml`

## What Was Checked

The template was aligned with common Unraid CA v2 practices:

- `Overview` is used as the primary description field.
- `ReadMe`, `Project`, `Support`, `TemplateURL`, and `Icon` point to direct repository URLs.
- The default persistent path maps `/app/data` to `/mnt/user/appdata/vapemixer/data`.
- The app uses `bridge` networking with a single web UI port on `3333`.
- Optional or deprecated metadata fields were left out where they are not needed.

## Local Use

To use the template locally on an Unraid server without publishing it to CA:

1. Copy `vapemixer.xml` to `/boot/config/plugins/dockerMan/templates-user/`.
2. In Unraid, open the `Docker` tab and choose `Add Container`.
3. Select the `VapeMixer` template.
4. Adjust the host port or AppData path if needed.
5. Apply the container configuration.

## Publishing To Community Applications

Typical CA publishing flow:

1. Keep the template in a public GitHub repository with a stable raw URL.
2. Create a support thread on the Unraid forums for the application.
3. Submit the app through the Community Applications submission form.
4. Wait for moderation review and adjust the template if feedback comes back.

## Notes

- The container image is `ghcr.io/vituhlos/vapemixer:latest`.
- The app stores its SQLite database under `/app/data`.
- The WebUI target is `http://[IP]:[PORT:3333]`.
