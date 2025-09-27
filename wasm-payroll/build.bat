@echo off

echo Installing wasm-pack...
powershell -Command "irm https://rustwasm.github.io/wasm-pack/installer/init.ps1 -UseBasicParsing | iex"

echo Building WebAssembly module...
wasm-pack build --target web --out-dir ../src/lib/wasm

echo WebAssembly module built successfully!