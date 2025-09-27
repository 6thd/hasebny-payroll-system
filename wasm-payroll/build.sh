#!/bin/bash

# Install wasm-pack if not already installed
if ! command -v wasm-pack &> /dev/null
then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WebAssembly module
echo "Building WebAssembly module..."
wasm-pack build --target web --out-dir ../src/lib/wasm

echo "WebAssembly module built successfully!"