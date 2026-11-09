// One icon family, one weight, everywhere: Phosphor bold.
// Icons are decorative by default; the control that holds one carries the accessible name.
import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowCounterClockwise,
  Barbell,
  CalendarBlank,
  Check,
  CheckCircle,
  CoffeeBean,
  DownloadSimple,
  Feather,
  Fire,
  Info,
  Keyboard,
  Lightbulb,
  ListChecks,
  Notebook,
  Play,
  Scales,
  Terminal,
  Timer,
  UploadSimple,
  Trash,
  Warning,
  X,
  XCircle,
  type IconProps,
} from '@phosphor-icons/react';

function bold(Icon: ComponentType<IconProps>) {
  return function BoldIcon(props: IconProps) {
    return <Icon weight="bold" aria-hidden="true" focusable="false" {...props} />;
  };
}

export const Ic = {
  ArrowLeft: bold(ArrowLeft),
  ArrowRight: bold(ArrowRight),
  External: bold(ArrowSquareOut),
  Redo: bold(ArrowCounterClockwise),
  Hard: bold(Barbell),
  Calendar: bold(CalendarBlank),
  Check: bold(Check),
  Correct: bold(CheckCircle),
  Xp: bold(CoffeeBean),
  Download: bold(DownloadSimple),
  Easy: bold(Feather),
  Streak: bold(Fire),
  Info: bold(Info),
  Keyboard: bold(Keyboard),
  Idea: bold(Lightbulb),
  List: bold(ListChecks),
  Notebook: bold(Notebook),
  Play: bold(Play),
  Ok: bold(Scales),
  Terminal: bold(Terminal),
  Timer: bold(Timer),
  Upload: bold(UploadSimple),
  Trash: bold(Trash),
  Trap: bold(Warning),
  Close: bold(X),
  Wrong: bold(XCircle),
};
