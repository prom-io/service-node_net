#!/bin/sh

root="$PWD"
bindir="$root/bin"
gosrc="$root/go-ethereum"

rm -rf "$bindir"

cd "$gosrc"
PWD="$gosrc"

go build
cp -r "$gosrc/build/bin" "$bindir"