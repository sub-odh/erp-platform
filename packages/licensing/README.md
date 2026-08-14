# @erp/licensing

Pure offline-license parsing, RS256 verification, canonicalization, and lifecycle evaluation for the ERP platform.

The signed JSON document contains camelCase payload fields plus a base64 `signature`. The signature covers the canonical JSON representation of every field except `signature`, with object keys sorted recursively.
