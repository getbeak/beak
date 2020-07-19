# Beak project file format

**Please note, this file format is intended iterated on a lot as the application matures. Beak will automatically upgrade existing project files to avoid.**

## Overview

The file is made up of various sections. It will always start with a header, and finish with a footer, but the sections in the middle can be in any order. So that cannot be relied on.

Every section always starts with the following two bits of information:

| name | value | type | length | description |
|------|-------|------|--------|-------------|
| Magic  | beak | ascii   | 0x04 | The magic string denoting what section this is. |
| Length | ---- | uint32  | 0x08 | The length of the section. |

In the documentation below, these are omitted, but do not forget that they are always there.

## Sections

- Header
- Links
- Activities
- Footer


### `header`

Magic: `beak`

| name | value | type | length | description |
|------|-------|------|--------|-------------|
| Version | 0x00 | uint16 | 0x04 | The version of the project file    |
| Name    | ---- | asciiz | 0x69 | The name of the project            |

### `folders`

Magic: `flds`

| name | value | type | length | description |
|------|-------|------|--------|-------------|
| Number of links | ---- | uint16 | 0x04 | The number of links in the file |

### `links`

Magic: `lnks`

| name | value | type | length | description |
|------|-------|------|--------|-------------|
| Number of links | ---- | uint16 | 0x04 | The number of links in the file |


### `activities`

Magic: `atvs`

| name | value | type | length | description |
|------|-------|------|--------|-------------|

### `footer`

Magic: `_eof`

| name | value | type | length | description |
|------|-------|------|--------|-------------|
