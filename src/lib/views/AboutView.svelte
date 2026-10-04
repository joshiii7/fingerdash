<script lang="ts">
  import { onMount } from 'svelte';
  import AOS from 'aos';
  import 'aos/dist/aos.css';
  import { prefersReducedMotion } from '../utils/typewriter';
  import PageBanner from '../components/PageBanner.svelte';
  import BadgeRow from '../components/BadgeRow.svelte';
  import Band from '../components/Band.svelte';
  import SectionHeader from '../components/SectionHeader.svelte';
  import CardGrid from '../components/CardGrid.svelte';
  import FeatureCard from '../components/FeatureCard.svelte';
  import CtaBlock from '../components/CtaBlock.svelte';
  import ButtonLink from '../components/ButtonLink.svelte';
  import CountUp from '../components/CountUp.svelte';
  import ExternalLink from '../components/ExternalLink.svelte';
  import EmailLink from '../components/EmailLink.svelte';
  import Screenshot from '../components/Screenshot.svelte';
  import type { IconName } from '../components/Icon.svelte';
  import { hrefFor } from '../router/router';
  import { AUTHOR_NAME, GITHUB_PROFILE_URL, ISSUES_URL, PORTFOLIO_URL } from '../config/site';
  import { SITE_STATS } from '../config/stats';

  interface Item {
    icon: IconName;
    title: string;
    body: string;
  }

  // Animate On Scroll, like the home page: each element animates in as it enters the screen
  // and out again as it leaves, so it plays again scrolling down and back up. Everything stays
  // as it is for people who prefer reduced motion.
  //
  // Fancybox opens the screenshots larger. It is loaded only here, after the page is up, and
  // ships with the site (no third-party request).
  onMount(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      offset: 90,
      once: false,
      mirror: true,
      disable: () => prefersReducedMotion(),
    });
    void document.fonts?.ready.then(() => AOS.refresh());

    let closed = false;
    let unbind: (() => void) | undefined;
    void (async () => {
      await import('@fancyapps/ui/dist/fancybox/fancybox.css');
      const { Fancybox } = await import('@fancyapps/ui/dist/fancybox/');
      if (closed) return;
      const reduced = prefersReducedMotion();
      Fancybox.bind('[data-fancybox="about"]', {
        // Fancybox doesn't mark its container as a dialog, so say so for screen readers.
        on: {
          ready: (fancybox: { getContainer: () => HTMLElement | undefined }) => {
            const container = fancybox.getContainer();
            container?.setAttribute('role', 'dialog');
            container?.setAttribute('aria-modal', 'true');
            container?.setAttribute('aria-label', 'Screenshot viewer. Press Escape to close.');
          },
        },
        // No fade or zoom for people who prefer reduced motion.
        ...(reduced ? { showClass: false, hideClass: false } : {}),
      });
      unbind = () => {
        Fancybox.close(true);
        Fancybox.unbind('[data-fancybox="about"]');
      };
    })();

    return () => {
      closed = true;
      unbind?.();
    };
  });

  const BADGES: { icon: IconName; label: string }[] = [
    { icon: 'free', label: 'Free' },
    { icon: 'no-account', label: 'No accounts' },
    { icon: 'open-source', label: 'Open source' },
  ];

  const DIFFERENT: Item[] = [
    {
      icon: 'book',
      title: 'Guided tutorial',
      body: 'Finger-by-finger lessons take you from the home row to numbers and punctuation, with an on-screen keyboard and hands that show the right finger for every key.',
    },
    {
      icon: 'gauge',
      title: 'Speed test modes',
      body: 'Test yourself over a set time or number of words, on quotes, on your own text, or on code, and see your speed, accuracy, and consistency.',
    },
    {
      icon: 'shield',
      title: 'No accounts and no tracking',
      body: 'There is nothing to sign up for. Your settings, personal bests, and progress stay in your own browser.',
    },
    {
      icon: 'heart',
      title: 'Free and open source',
      body: 'Fingerdash is free to use, and the code is public on GitHub for anyone to read, run, or improve.',
    },
  ];

  const VALUES: Item[] = [
    {
      icon: 'layout',
      title: 'Simple over cluttered',
      body: 'One place to learn the keys and then test your speed, in a dark, distraction-free layout. There is nothing to set up before you start typing.',
    },
    {
      icon: 'shield',
      title: 'Privacy by default',
      body: 'No accounts, no cookies, and no analytics. What Fingerdash remembers lives in your browser, and you can clear it whenever you like.',
    },
    {
      icon: 'branch',
      title: 'Open by design',
      body: 'The source is public. Built with Svelte, TypeScript, and SCSS and hosted on Vercel, it is easy to read, run yourself, or change.',
    },
  ];
</script>

<PageBanner
  title="About Fingerdash"
  lead="A free touch-typing tutorial and typing test that runs entirely in your browser."
>
  <BadgeRow items={BADGES} label="Fingerdash is" />
</PageBanner>

<div class="aos-scope">
  <Band tone="bg" labelledby="story-title">
    <div class="story">
      <div class="story-text" data-aos="fade-right">
        <SectionHeader eyebrow="Our story" title="Why I built Fingerdash" id="story-title" />
        <p>
          I'm a programmer, and touch typing is one of my skills, which is exactly why Fingerdash
          exists. I came up with the idea because I wanted one simple place to learn the keys
          properly and then test my speed, without hopping between a tutorial site and a separate
          typing test.
        </p>
        <p>
          I built it the way I'd want to use it. There are no accounts to create, because I never
          liked signing up just to practice. There's no tracking, so your progress and personal
          bests stay in your own browser. It's free and open source, so anyone can see how it works,
          suggest improvements, or fix something. And the dark, distraction-free look is on purpose,
          so the only thing on screen worth your attention is the text in front of you.
        </p>
        <p>
          Fingerdash is still growing, and I use it and improve it as a typist first. If you have an
          idea, find a bug, or just want to say hello, open an issue on GitHub or send me a message.
        </p>
        <p class="creator">
          Created by {AUTHOR_NAME}.
          <ExternalLink href={GITHUB_PROFILE_URL} me>GitHub profile</ExternalLink
          >{#if PORTFOLIO_URL}
            &middot; <ExternalLink href={PORTFOLIO_URL}>Portfolio</ExternalLink>{/if}
        </p>
      </div>

      <div data-aos="fade-left" data-aos-delay="150">
        <Screenshot
          zoom
          name="screenshot-test"
          alt="The typing test partway through a sentence. The word “but” was typed as “buy”, so a small red y sits above the wrong t, and two more mistakes in “climb” and “group” are marked the same way."
          caption="The test shows the key you pressed, small, above each wrong letter."
          sizes="(min-width: 56rem) 40vw, 100vw"
        />
      </div>
    </div>
  </Band>

  <Band tone="surface" labelledby="different-title">
    <div data-aos="fade-up">
      <SectionHeader
        eyebrow="What sets it apart"
        title="What makes Fingerdash different"
        id="different-title"
        align="center"
      />
    </div>
    <CardGrid columns={4}>
      {#each DIFFERENT as item, i (item.title)}
        <FeatureCard
          icon={item.icon}
          title={item.title}
          body={item.body}
          data-aos="fade-up"
          data-aos-delay={i * 100}
        />
      {/each}
    </CardGrid>

    <div class="shots">
      <div data-aos="fade-right">
        <Screenshot
          zoom
          name="screenshot-tutorial"
          alt="A tutorial lesson, Home Row: D and K. The next key, D, is highlighted on the on-screen keyboard, and the left middle finger is highlighted on the hands guide."
          caption="In a lesson, the next key and the finger that presses it light up."
          sizes="(min-width: 56rem) 45vw, 100vw"
        />
      </div>
      <div data-aos="fade-left" data-aos-delay="150">
        <Screenshot
          zoom
          name="screenshot-tutorial-intro"
          alt="The introduction to the lesson Home Row: F and J. The keyboard and hands guide are tinted to show the zone each index finger covers, above short sections that explain why."
          caption="Every lesson starts with why, not just what, and shows each finger's zone."
          sizes="(min-width: 56rem) 45vw, 100vw"
        />
      </div>
    </div>
  </Band>

  <Band tone="bg" labelledby="values-title">
    <div data-aos="fade-up">
      <SectionHeader
        eyebrow="Our values"
        title="How Fingerdash is built"
        id="values-title"
        align="center"
      />
    </div>
    <CardGrid columns={3}>
      {#each VALUES as item, i (item.title)}
        <FeatureCard
          icon={item.icon}
          title={item.title}
          body={item.body}
          data-aos="zoom-in-up"
          data-aos-delay={i * 120}
        />
      {/each}
    </CardGrid>
  </Band>

  <Band tone="dark" labelledby="numbers-title">
    <div data-aos="fade-up">
      <SectionHeader
        eyebrow="By the numbers"
        title="Fingerdash at a glance"
        id="numbers-title"
        align="center"
        onDark
      />
    </div>
    <ul class="stats" data-aos="fade-up" data-aos-delay="100">
      {#each SITE_STATS as stat (stat.label)}
        <li>
          <span class="stat-value"><CountUp value={stat.value} /></span>
          <span class="stat-label">{stat.label}</span>
        </li>
      {/each}
    </ul>
  </Band>

  <Band tone="surface" labelledby="cta-title">
    <div data-aos="zoom-in-up">
      <CtaBlock
        eyebrow="Get started"
        title="Ready to type faster?"
        id="cta-title"
        line="Learn the keys, then test your speed. It all runs in your browser."
      >
        {#snippet actions()}
          <ButtonLink variant="primary" href={hrefFor('tutorial')}>Start the tutorial</ButtonLink>
          <ButtonLink href={hrefFor('test')}>Take the typing test</ButtonLink>
        {/snippet}
        {#snippet more()}
          <p><ExternalLink href={GITHUB_PROFILE_URL} me>View on GitHub</ExternalLink></p>
          <p>
            Found a bug or have an idea?
            <ExternalLink href={ISSUES_URL}>Open an issue on GitHub</ExternalLink>, or email
            <EmailLink />.
          </p>
        {/snippet}
      </CtaBlock>
    </div>
  </Band>
</div>

<style lang="scss">
  @use '../../styles/variables' as *;

  // AOS slides elements in from the side; clip so that can never add a horizontal scrollbar.
  .aos-scope {
    overflow-x: clip;
  }

  // --- Our story: text and a visual side by side on desktop, stacked on phones ---
  .story {
    display: grid;
    gap: $space-8;
    align-items: center;

    @media (min-width: 56rem) {
      grid-template-columns: 1.15fr 1fr;
      gap: $space-12;
    }
  }

  .story-text {
    p {
      margin: 0 0 $space-4;
      color: var(--color-text-muted);
      font-size: 1.05rem;
      line-height: 1.75;
    }

    .creator {
      margin-bottom: 0;
      padding-top: $space-4;
      border-top: 1px solid var(--color-border);
      font-size: 0.95rem;
    }
  }

  // The tutorial screenshots: side by side on desktop, stacked on phones.
  .shots {
    display: grid;
    gap: $space-8;
    margin-top: $space-12;

    @media (min-width: 56rem) {
      grid-template-columns: repeat(2, 1fr);
      align-items: start;
    }
  }

  // --- By the numbers (always-dark strip) ---
  .stats {
    display: grid;
    gap: $space-8 $space-4;
    grid-template-columns: repeat(2, 1fr);
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: center;

    @media (min-width: 56rem) {
      grid-template-columns: repeat(4, 1fr);
    }

    li {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $space-1;
    }
  }

  .stat-value {
    font-size: clamp(2.5rem, 6vw, 3.75rem);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    color: #58a6ff;
  }

  .stat-label {
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #9aa5b1;
  }
</style>
