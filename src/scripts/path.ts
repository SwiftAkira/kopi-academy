// Path map: paint each lesson node with the user's state, then draw the path in.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { countdownTo, formatDay, resolveSchedule, type ScheduleFile } from '../lib/schedule';
import { cupLevel, lessonState, STATE_LABEL, type NodeState } from '../lib/status';
import { getState, subscribe, today } from '../lib/store';

const root = document.querySelector<HTMLElement>('[data-path]');

const CHIP: Record<NodeState, string> = {
  done: 'chip chip--done node__chip',
  today: 'chip chip--today node__chip',
  catchup: 'chip chip--catch node__chip',
  started: 'chip chip--quiet node__chip',
  upcoming: 'chip node__chip',
};

function paint(): void {
  if (!root) return;
  const state = getState();
  const now = new Date();
  const day = today();
  const file = JSON.parse(root.dataset.schedule || '{}') as ScheduleFile;
  const sched = resolveSchedule(file, state.settings.schedule, now);
  let done = 0;

  root.querySelectorAll<HTMLElement>('.node').forEach((node) => {
    const id = node.dataset.lesson!;
    const s = lessonState(id, state, sched, day);
    if (s === 'done') done += 1;
    node.dataset.state = s;
    node.querySelector('.cup')?.setAttribute('data-level', String(cupLevel(s, Boolean(state.lessons[id]))));
    const chip = node.querySelector<HTMLElement>('.node__chip');
    if (chip) {
      chip.className = CHIP[s];
      chip.textContent = STATE_LABEL[s];
      chip.hidden = s === 'upcoming';
    }
    const date = node.querySelector<HTMLElement>('.node__date');
    if (date) date.textContent = sched.dated && sched.dates[id] && s !== 'done' && s !== 'today' ? formatDay(sched.dates[id]) : '';
  });

  // the inked part of each rail runs down to the last finished lesson
  root.querySelectorAll<HTMLElement>('.path__list').forEach((list) => {
    const nodes = [...list.querySelectorAll<HTMLElement>('.node')];
    let last = -1;
    nodes.forEach((n, i) => {
      if (n.dataset.state === 'done') last = i;
    });
    const fill = last < 0 ? 0 : nodes[last].offsetTop + 30;
    list.style.setProperty('--fill', `${fill}px`);
  });

  const count = root.querySelector('[data-path-done]');
  if (count) count.textContent = String(done);

  const examChip = root.querySelector<HTMLElement>('[data-path-exam]');
  const exam = sched.exams.find((e) => e.id === root.dataset.exam);
  if (examChip) {
    const left = exam ? countdownTo(exam.at, now) : null;
    examChip.hidden = !left || left.past;
    if (left && !left.past) examChip.textContent = left.today ? 'Exam today' : `Exam in ${left.days} ${left.days === 1 ? 'day' : 'days'}`;
  }
}

if (root) {
  paint();
  subscribe(paint);
  window.addEventListener('resize', paint, { passive: true });

  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  // With reduced motion nothing below runs: the path is simply there.
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // nodes that start below the fold pop in as they arrive; what is already on screen stays put
    const below = [...root.querySelectorAll<HTMLElement>('.node')].filter(
      (n) => n.getBoundingClientRect().top > window.innerHeight * 0.92,
    );
    gsap.set(below, { autoAlpha: 0, y: 18 });
    ScrollTrigger.batch(below, {
      start: 'top 92%',
      once: true,
      onEnter: (els) =>
        gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.32, ease: 'power2.out', stagger: 0.06, clearProps: 'opacity,visibility,transform' }),
    });

    // the inked rail draws downwards as each group scrolls into view
    root.querySelectorAll<HTMLElement>('.path__list').forEach((list) => {
      gsap.fromTo(
        list,
        { '--draw': 0 },
        { '--draw': 1, duration: 0.4, ease: 'power1.out', scrollTrigger: { trigger: list, start: 'top 85%', once: true } },
      );
    });
    return () => {
      gsap.set(root.querySelectorAll('.node'), { clearProps: 'all' });
      root.querySelectorAll<HTMLElement>('.path__list').forEach((l) => l.style.removeProperty('--draw'));
    };
  });
}
