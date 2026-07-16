// Central icon re-export — every component imports icons from here rather
// than 'lucide-react' directly, so the underlying icon library can be swapped
// in one place. Replaces emoji use across the app.
//
// Wrapped (not re-exported raw) so every icon defaults to the same thin
// monoline stroke weight instead of lucide's bolder default — override with
// an explicit strokeWidth prop where needed.

import {
  Flame as FlameIcon,
  Zap as ZapIcon,
  FileText as FileTextIcon,
  PenLine as PenLineIcon,
  User as UserIcon,
  Star as StarIcon,
  Check as CheckIcon,
  X as XIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ArrowRight as ArrowRightIcon,
  BookOpen as BookOpenIcon,
  BookMarked as BookMarkedIcon,
  Trophy as TrophyIcon,
  GraduationCap as GraduationCapIcon,
  Target as TargetIcon,
  AlertTriangle as AlertTriangleIcon,
  Lightbulb as LightbulbIcon,
  Eye as EyeIcon,
  Globe as GlobeIcon,
  Brain as BrainIcon,
  ListChecks as ListChecksIcon,
  Layers as LayersIcon,
  RefreshCw as RefreshCwIcon,
  Heart as HeartIcon,
  Home as HomeIcon,
  Calculator as CalculatorIcon,
  FlaskConical as FlaskConicalIcon,
  Landmark as LandmarkIcon,
  Briefcase as BriefcaseIcon,
  Cog as CogIcon,
  TrendingUp as TrendingUpIcon,
  type LucideProps,
} from 'lucide-react'

export type IconProps = LucideProps

function withDefaultStroke(Icon: React.ComponentType<LucideProps>) {
  return function Wrapped({ strokeWidth = 1.75, ...props }: LucideProps) {
    return <Icon strokeWidth={strokeWidth} {...props} />
  }
}

export const Flame = withDefaultStroke(FlameIcon)
export const Zap = withDefaultStroke(ZapIcon)
export const FileText = withDefaultStroke(FileTextIcon)
export const PenLine = withDefaultStroke(PenLineIcon)
export const User = withDefaultStroke(UserIcon)
export const Star = withDefaultStroke(StarIcon)
export const Check = withDefaultStroke(CheckIcon)
export const X = withDefaultStroke(XIcon)
export const Lock = withDefaultStroke(LockIcon)
export const Search = withDefaultStroke(SearchIcon)
export const ChevronRight = withDefaultStroke(ChevronRightIcon)
export const ChevronLeft = withDefaultStroke(ChevronLeftIcon)
export const ArrowRight = withDefaultStroke(ArrowRightIcon)
export const BookOpen = withDefaultStroke(BookOpenIcon)
export const BookMarked = withDefaultStroke(BookMarkedIcon)
export const Trophy = withDefaultStroke(TrophyIcon)
export const GraduationCap = withDefaultStroke(GraduationCapIcon)
export const Target = withDefaultStroke(TargetIcon)
export const AlertTriangle = withDefaultStroke(AlertTriangleIcon)
export const Lightbulb = withDefaultStroke(LightbulbIcon)
export const Eye = withDefaultStroke(EyeIcon)
export const Globe = withDefaultStroke(GlobeIcon)
export const Brain = withDefaultStroke(BrainIcon)
export const ListChecks = withDefaultStroke(ListChecksIcon)
export const Layers = withDefaultStroke(LayersIcon)
export const RefreshCw = withDefaultStroke(RefreshCwIcon)
export const Heart = withDefaultStroke(HeartIcon)
export const Home = withDefaultStroke(HomeIcon)
export const Calculator = withDefaultStroke(CalculatorIcon)
export const FlaskConical = withDefaultStroke(FlaskConicalIcon)
export const Landmark = withDefaultStroke(LandmarkIcon)
export const Briefcase = withDefaultStroke(BriefcaseIcon)
export const Cog = withDefaultStroke(CogIcon)
export const TrendingUp = withDefaultStroke(TrendingUpIcon)
