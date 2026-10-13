#!/usr/bin/env bash
# Tắt Supabase thu nhỏ (e2e-that) đang chạy trên máy.
for p in 54321 9999 3002 2525; do fuser -k "$p/tcp" 2>/dev/null || true; done
