## rev()

### rev.manifest([path], [options])

#### path

Type: `string`
Default: `"rev-manifest.json"`

Manifest file path.

#### options

##### base

Type: `string`
Default: `process.cwd()`

Override the `base` of the manifest file.

##### cwd

Type: `string`
Default: `process.cwd()`

Override the `cwd` (current working directory) of the manifest file.

##### merge

Type: `boolean`
Default: `false`

Merge existing manifest file.

##### transformer

Type: `object`
Default: `JSON`

An object with `parse` and `stringify` methods. This can be used to provide a
custom transformer instead of the default `JSON` for the manifest file.

##### [next: Original path and asset hash] (original_path_and_asset_hash.md)
