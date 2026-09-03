# ai-usage-tui-site

The website for [ai-usage-tui](https://github.com/SophanaSok/ai-usage-tui),
served at <https://sophanasok.github.io/ai-usage-tui-site/>.

The site keeps no copy of the product's documentation. At build time it reads
the app repository, expected at `../ai-usage-tui` or wherever `AIU_SRC`
points, and renders its README, changelog and routing guide, copying the
screenshots alongside. The home page's hero is the dashboard drawn in HTML from
the same invented demo data as those screenshots; every string it shows is
registered with its origin and checked. The version shown is the newest dated
entry in the app's changelog. In CI the app is checked out at its latest GitHub
release, so the site never describes something that cannot be installed.

```sh
npm install
npm run dev       # http://localhost:4321/ai-usage-tui-site/
npm run verify    # build, then the checks in tests/
```

`npm run check` fails if any file here pins a version, if a trusted asset did
not reach the page, if an internal link does not resolve, if the hero shows a
string it has not registered, or if the page's colours drift from the ones the
dashboard draws with.
