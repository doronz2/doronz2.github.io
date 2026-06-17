# Doron Zarchy Personal Website

Static personal website for Doron Zarchy.

## Local Preview

Open `index.html` directly in a browser, or serve the folder locally:

```sh
python3 -m http.server 8080
```

The CRelections demo page at `voting.html` expects the demo server to run at
`http://localhost:3000`:

```sh
git clone https://github.com/doronz2/CRelections.git
cd CRelections
LIBRARY_PATH=/opt/homebrew/lib cargo run -- server
```

## Deploy

This repo is ready for GitHub Pages as `doronzarchy.github.io`.
