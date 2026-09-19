<script lang="ts">
  import { onMount } from 'svelte';
  import { hrefFor } from '../router/router';
  import PageBanner from '../components/PageBanner.svelte';
  import BadgeRow from '../components/BadgeRow.svelte';
  import Band from '../components/Band.svelte';
  import SectionHeader from '../components/SectionHeader.svelte';
  import Prose from '../components/Prose.svelte';
  import CardGrid from '../components/CardGrid.svelte';
  import FeatureCard from '../components/FeatureCard.svelte';
  import CtaBlock from '../components/CtaBlock.svelte';
  import ButtonLink from '../components/ButtonLink.svelte';
  import ExternalLink from '../components/ExternalLink.svelte';
  import Accordion from '../components/Accordion.svelte';
  import AOS from 'aos';
  import 'aos/dist/aos.css';
  import { prefersReducedMotion } from '../utils/typewriter';
  import type { IconName } from '../components/Icon.svelte';
  import { GITHUB_PROFILE_URL } from '../config/site';
  import { FAQ_ITEMS } from '../../data/faq';
  import { lessons, type LessonGroup } from '../../data/lessons';

  // The steps come in from the sides and the middle, like the AOS demos.
  const STEP_EFFECTS = ['fade-right', 'fade-up', 'fade-left'];

  // Animate On Scroll: each element with a data-aos attribute animates in as it enters the
  // screen and out again as it leaves, so it plays again scrolling down and back up.
  // Everything is left as it is for people who prefer reduced motion.
  onMount(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      offset: 90,
      once: false,
      mirror: true,
      disable: () => prefersReducedMotion(),
    });
    // Fonts and images change heights, which moves the trigger points.
    void document.fonts?.ready.then(() => AOS.refresh());
  });

  const BADGES: { icon: IconName; label: string }[] = [
    { icon: 'free', label: 'Free' },
    { icon: 'no-account', label: 'No accounts' },
    { icon: 'open-source', label: 'Open source' },
  ];

  const FEATURES: { icon: IconName; title: string; body: string }[] = [
    {
      icon: 'gauge',
      title: 'Typing test',
      body: 'Time-based or word-count tests, with optional punctuation and numbers. Your personal bests are tracked per mode.',
    },
    {
      icon: 'book',
      title: 'Guided tutorial',
      body: 'Short lessons that add a few keys at a time. Each one explains why, and has a pass mark for speed and accuracy.',
    },
    {
      icon: 'keyboard',
      title: 'Finger guide',
      body: 'An on-screen keyboard and a pair of hands light up the next key and the finger that should press it.',
    },
    {
      icon: 'palette',
      title: 'Themes and commands',
      body: 'Switch between GitHub Dark, GitHub Light, Nord, and Solarized from the command palette.',
    },
  ];

  const STEPS: { icon: IconName; title: string; body: string }[] = [
    {
      icon: 'keyboard',
      title: '1. Start on the home row',
      body: 'Rest your fingers on the middle row and learn F and J first. Everything else is measured from here.',
    },
    {
      icon: 'layout',
      title: '2. Add one row at a time',
      body: 'Reach up to the top row, down to the bottom row, then out to numbers and punctuation.',
    },
    {
      icon: 'gauge',
      title: '3. Test your speed',
      body: 'Take a timed test to see your words per minute, accuracy, and how steady your pace is.',
    },
  ];

  const GROUP_LABELS: Record<LessonGroup, string> = {
    basics: 'Getting started',
    'home-row': 'Home row',
    'top-row': 'Top row',
    'bottom-row': 'Bottom row',
    numbers: 'Numbers',
    punctuation: 'Shift and punctuation',
    practice: 'Accuracy and rhythm',
  };

  const groups = (Object.keys(GROUP_LABELS) as LessonGroup[]).map((group) => ({
    label: GROUP_LABELS[group],
    count: lessons.filter((l) => l.group === group).length,
  }));

  const PROMISES: { icon: IconName; title: string; body: string; href: string; link: string }[] = [
    {
      icon: 'free',
      title: 'Free and open source',
      body: 'No sign-up and no cost. The code is public, so you can read it or suggest changes.',
      href: hrefFor('about'),
      link: 'About Fingerdash',
    },
    {
      icon: 'shield',
      title: 'Private by design',
      body: 'No accounts, tracking, or analytics. Your progress stays in your own browser.',
      href: hrefFor('privacy'),
      link: 'Read the privacy page',
    },
    {
      icon: 'eye',
      title: 'Built for the keyboard',
      body: 'Visible focus, reduced-motion support, and a command palette so you rarely need a mouse.',
      href: hrefFor('accessibility'),
      link: 'Accessibility details',
    },
  ];
</script>

<PageBanner
  variant="hero"
  typewriter
  title="Fingerdash"
  lead="A free touch-typing tutorial and a Monkeytype-style typing test, right in your browser."
>
  <BadgeRow items={BADGES} label="Fingerdash is" />
  <div class="cta-row">
    <a class="btn primary" href={hrefFor('tutorial')}>Start the tutorial</a>
    <a class="btn" href={hrefFor('test')}>Take a typing test</a>
  </div>
</PageBanner>

<div class="aos-scope">
  <Band tone="surface" labelledby="features-heading">
    <div data-aos="fade-up">
      <SectionHeader eyebrow="Features" title="What you get" id="features-heading" align="center" />
    </div>
    <div data-aos="fade-up" data-aos-delay="100">
      <Prose>
        <p>
          Learn the keys with guided lessons, then measure your speed with a timed test. Everything
          runs in your browser.
        </p>
      </Prose>
    </div>
    <CardGrid columns={4} spaced>
      {#each FEATURES as feature, i (feature.title)}
        <FeatureCard
          icon={feature.icon}
          title={feature.title}
          body={feature.body}
          data-aos="fade-up"
          data-aos-delay={i * 100}
        />
      {/each}
    </CardGrid>
  </Band>

  <Band tone="bg" labelledby="how-heading">
    <div data-aos="fade-up">
      <SectionHeader eyebrow="How it works" title="Three steps" id="how-heading" align="center" />
    </div>
    <CardGrid columns={3}>
      {#each STEPS as step, i (step.title)}
        <FeatureCard
          icon={step.icon}
          title={step.title}
          body={step.body}
          data-aos={STEP_EFFECTS[i]}
          data-aos-delay={i * 120}
        />
      {/each}
    </CardGrid>
  </Band>

  <Band tone="surface" labelledby="path-heading">
    <div data-aos="fade-up">
      <SectionHeader eyebrow="Lessons" title="The lesson path" id="path-heading" align="center" />
    </div>
    <div data-aos="fade-up" data-aos-delay="100">
      <Prose>
        <p>
          {lessons.length} lessons in {groups.length} stages. Each one explains why before you practice,
          and each drill uses only keys you've already met.
        </p>
      </Prose>
    </div>
    <ul class="path">
      {#each groups as group, i (group.label)}
        <li data-aos="zoom-in" data-aos-delay={i * 70}>
          <span class="path-label">{group.label}</span>
          <span class="path-count">{group.count} lessons</span>
        </li>
      {/each}
    </ul>
  </Band>

  <Band tone="bg" labelledby="promise-heading">
    <div data-aos="fade-up">
      <SectionHeader
        eyebrow="Our promise"
        title="Free, private, and accessible"
        id="promise-heading"
        align="center"
      />
    </div>
    <CardGrid columns={3}>
      {#each PROMISES as promise, i (promise.title)}
        <FeatureCard
          icon={promise.icon}
          title={promise.title}
          data-aos="zoom-in-up"
          data-aos-delay={i * 120}
        >
          <p>{promise.body}</p>
          <p><a href={promise.href}>{promise.link}</a></p>
        </FeatureCard>
      {/each}
    </CardGrid>
  </Band>

  <Band tone="surface" labelledby="cta-heading">
    <div data-aos="zoom-in-up">
      <CtaBlock
        eyebrow="Get started"
        title="Ready to type faster?"
        id="cta-heading"
        line="Start with the home row, or jump straight into a test."
      >
        {#snippet actions()}
          <ButtonLink variant="primary" href={hrefFor('tutorial')}>Start the tutorial</ButtonLink>
          <ButtonLink href={hrefFor('test')}>Take a typing test</ButtonLink>
        {/snippet}
        {#snippet more()}
          <p>
            If you spot something to improve, the code is on
            <ExternalLink href={GITHUB_PROFILE_URL} me>GitHub</ExternalLink>.
          </p>
        {/snippet}
      </CtaBlock>
    </div>
  </Band>

  <Band tone="bg" labelledby="faq-heading">
    <div data-aos="fade-up">
      <SectionHeader
        eyebrow="FAQ"
        title="Frequently asked questions"
        id="faq-heading"
        align="center"
      />
    </div>
    <div class="faq" data-aos="fade-up" data-aos-delay="100">
      <Accordion items={FAQ_ITEMS} idPrefix="faq" headingLevel={3} />
    </div>
  </Band>
</div>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  // AOS slides elements in from the side; clip so that can never add a horizontal scrollbar.
  .aos-scope {
    overflow-x: clip;
  }

  .cta-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $space-3;
    margin-top: $space-6;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    background: var(--color-surface-raised);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    padding: $space-2 $space-6;
    font-size: 1rem;
    cursor: pointer;
    @include touch-target;
    transition: border-color $transition-fast;

    &:hover {
      border-color: var(--color-accent);
    }

    &.primary {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-bg);
      font-weight: 600;
    }
  }

  .path {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    margin: $space-8 0 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      flex-direction: column;
      gap: $space-1;
      flex: 1 1 8rem;
      padding: $space-4;
      background: var(--card-bg, var(--color-surface));
      border: 1px solid var(--color-border);
      border-radius: $radius-lg;
      text-align: center;
    }
  }

  .path-label {
    font-weight: 600;
  }

  .path-count {
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .faq {
    max-width: 50rem;
    margin-inline: auto;
  }

  // AOS leaves a transform on cards once they have animated in; keep their hover lift working.
  :global(.card[data-aos].aos-animate:hover) {
    transform: translateY(-4px);
  }
</style>
