#!/bin/bash

# Claude Code Status Line Script
# Displays project info, git branch, model, and context usage
# Read JSON input from stdin

input=$(cat)

# Extract basic information using jq
folder=$(basename "$(echo "$input" | jq -r '.workspace.current_dir')")
model=$(echo "$input" | jq -r '.model.display_name')

# Context remaining (if available)
context_remaining=""
ctx_used=$(echo "$input" | jq -r '.context.used_tokens // empty')
ctx_max=$(echo "$input" | jq -r '.context.max_tokens // empty')
if [ -n "$ctx_used" ] && [ -n "$ctx_max" ] && [ "$ctx_max" != "0" ]; then
  ctx_pct=$((100 - (ctx_used * 100 / ctx_max)))
  context_remaining=" | 🧠 ${ctx_pct}%"
fi

# Detect project type and language info
lang_info=""

# Check for Node.js/TypeScript project
if [ -f "package.json" ]; then
  node_ver=$(node --version 2>/dev/null | sed 's/v//' || echo '')
  if [ -n "$node_ver" ]; then
    lang_info=" | ⬢ $node_ver"
  fi
# Check for Python project
elif [ -n "$VIRTUAL_ENV" ]; then
  venv_raw=$(echo "${VIRTUAL_ENV##*/}" | sed 's/-[0-9].*//')
  if [ "$venv_raw" = ".venv" ] || [ "$venv_raw" = "venv" ]; then
    venv="($folder)"
  else
    venv="($venv_raw)"
  fi
  pyver=$(python3 --version 2>/dev/null | cut -d' ' -f2 || echo '')
  if [ -n "$pyver" ]; then
    lang_info=" | 🐍 $pyver $venv"
  fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  pyver=$(python3 --version 2>/dev/null | cut -d' ' -f2 || echo '')
  if [ -n "$pyver" ]; then
    lang_info=" | 🐍 $pyver"
  fi
# Check for Go project
elif [ -f "go.mod" ]; then
  gover=$(go version 2>/dev/null | grep -oE 'go[0-9]+\.[0-9]+' | sed 's/go//' || echo '')
  if [ -n "$gover" ]; then
    lang_info=" | 🦫 $gover"
  fi
# Check for Rust project
elif [ -f "Cargo.toml" ]; then
  rustver=$(rustc --version 2>/dev/null | cut -d' ' -f2 || echo '')
  if [ -n "$rustver" ]; then
    lang_info=" | 🦀 $rustver"
  fi
fi

# Git branch
branch=""
if git rev-parse --git-dir > /dev/null 2>&1; then
  branch_name=$(git branch --show-current 2>/dev/null)
  if [ -n "$branch_name" ]; then
    branch=" | 🌿 $branch_name"
  fi
fi

# Build and output status line
echo "📁 $folder${lang_info}${branch} | 🤖 $model${context_remaining}"
