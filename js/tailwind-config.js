// shared tailwind config for the whole site
// this file gets loaded on every page right after the tailwind cdn script
// so everyone is using the same colours/fonts. add to this instead of
// making up new one-off colours in a page.

tailwind.config = {
  theme: {
    extend: {
      colors: {
        // dark navy - main brand colour, used for primary buttons,
        // headings, hero overlays
        navy: '#16233B',
        // a step lighter than navy, used for secondary button bg tint
        // and hover states
        navylight: '#3B5170',
        // pale navy tint, basically navy at low opacity baked into a
        // solid colour so it plays nice with tailwind's colour utilities
        navytint: '#E7EAF0',

        // warm cream background colour, this is the main page bg
        cream: '#F7F4EC',

        // plain white-ish card surface, sits on top of cream
        surface: '#FFFFFF',
        surfacealt: '#F1EFE8',

        // neutral grays for body text / borders, keep these instead of
        // pure black/gray so it stays warm and matches the cream bg
        stone: '#6B6F76',
        stonedark: '#33363B',
        border: '#E3E0D8'
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
