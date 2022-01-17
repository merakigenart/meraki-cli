<p align="center">
    <img style="width: 400px;" src="https://user-images.githubusercontent.com/5508707/149785606-961dba2b-1c08-4848-9d5c-0e3e089da04a.png" alt="" />
</p>

# meraki-cli

Meraki local script development utility

## Installation

To install `meraki-cli`, run `npm install`:

```bash
npm install meraki-cli --save-dev
```

## Usage

To run Meraki script checks for a file, run:

```bash
./node_modules/.bin/meraki-cli check /path/to/my/Script.js
```
You will see output similar to the following:

![image](https://user-images.githubusercontent.com/5508707/149785418-49c981f2-060e-4dcd-a0d5-296e9e3a81ca.png)


## Development

### Setup

```bash
npm install

npm run dev
```

### Testing

`meraki-cli` uses Jest for unit tests.  To run the test suite:

`npm run test`

---

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

- [Patrick Organ](https://github.com/patinthehat)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.
