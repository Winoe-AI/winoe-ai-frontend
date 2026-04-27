#!/usr/bin/env bash

load_contract_live_env_file() {
  local env_file="$1"

  [[ -f "$env_file" ]] || return 0

  local raw_line line key value
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    line="${raw_line%$'\r'}"
    line="${line#"${line%%[!$' \t']*}"}"

    [[ -z "$line" || "${line:0:1}" == "#" ]] && continue

    if [[ "$line" =~ ^(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
      key="${BASH_REMATCH[2]}"
      value="${BASH_REMATCH[3]}"
      value="${value#"${value%%[!$' \t']*}"}"

      if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:-1}"
      elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:-1}"
      else
        if [[ "$value" =~ ^(.*[[:space:]])#.*$ ]]; then
          value="${BASH_REMATCH[1]}"
          value="${value%"${value##*[!$' \t']}"}"
        else
          value="${value%"${value##*[!$' \t']}"}"
        fi
      fi

      if [[ -z "${!key:-}" ]]; then
        export "$key=$value"
      fi
    fi
  done < "$env_file"
}

load_contract_live_local_env() {
  local frontend_env="$1"
  local backend_env="$2"

  load_contract_live_env_file "$frontend_env"
  load_contract_live_env_file "$backend_env"
}
