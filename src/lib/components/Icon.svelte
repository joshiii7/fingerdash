<script lang="ts" module>
  export type IconName =
    | 'free'
    | 'no-account'
    | 'open-source'
    | 'book'
    | 'gauge'
    | 'shield'
    | 'layout'
    | 'branch'
    | 'heart'
    | 'eye-off'
    | 'eye'
    | 'cookie'
    | 'sliders'
    | 'file'
    | 'globe'
    | 'trash'
    | 'mail'
    | 'keyboard'
    | 'search'
    | 'palette'
    | 'contrast'
    | 'pause'
    | 'speaker'
    | 'alert'
    | 'message'
    | 'chevron'
    | 'crosshair'
    | 'speaker-off';

  // 24x24 outline paths, drawn for Fingerdash. Stroked, so they take the surrounding text color.
  const PATHS: Record<IconName, string> = {
    free: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V4h9l8.6 8.6a2 2 0 0 1 0 2.8zM7.5 8.5h.01',
    'no-account': 'M4 21c0-4 3.6-7 8-7s8 3 8 7M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 3l18 18',
    'open-source': 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
    book: 'M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2V5zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8V5z',
    gauge: 'M3.5 17a9 9 0 1 1 17 0M12 14l4-4',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
    layout: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 9h18M9 21V9',
    branch:
      'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
    heart:
      'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
    'eye-off':
      'M2 12s4-7 10-7c2 0 3.8.8 5.3 1.9M22 12s-4 7-10 7c-2 0-3.8-.8-5.3-1.9M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    cookie:
      'M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5zM8.5 10h.01M11 15h.01M15.5 14h.01M8 15h.01',
    sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6',
    globe:
      'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6',
    keyboard:
      'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
    palette:
      'M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.3A3.7 3.7 0 0 0 21 11c0-4.4-4-8-9-8zM7.5 11h.01M10 7h.01M15 7h.01',
    contrast: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M12 7h4M12 12h5M12 17h4',
    pause: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 9v6M14 9v6',
    speaker: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
    alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
    message: 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z',
    chevron: 'M6 9l6 6 6-6',
    crosshair: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 1v6M12 17v6M1 12h6M17 12h6',
    'speaker-off': 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
  };
</script>

<script lang="ts">
  interface Props {
    name: IconName;
  }

  let { name }: Props = $props();
</script>

<!-- Decorative: the text next to an icon always says the same thing. -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d={PATHS[name]} />
</svg>

<style>
  .icon {
    width: 1em;
    height: 1em;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
