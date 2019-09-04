#!/bin/sh

root="$PWD"
bindir="$root/bin"
gosrc="$root/go-ethereum"

rm -rf "$bindir"

cd "$gosrc"
PWD="$gosrc"

$gosrc/build/env.sh go run build/ci.go install
cp -r "$gosrc/build/bin" "$bindir"
