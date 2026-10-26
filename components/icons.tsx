// Central icon re-export — every component imports icons from here rather
// than from the icon package directly, so the underlying icon set can be
// swapped in one place. Replaces emoji use across the app.
//
// The set is Heroicons (outline, 24px) — the same pack used in the Figma
// education template. Wrapped so icons keep the `size` prop the app already
// uses (Heroicons only take width/height). Heroicons has no brain or target
// icon, so those two map to the closest meaning (Sparkles for Bloom the AI
// tutor, a viewfinder circle for the quiz target).

import {
  FireIcon,
  BoltIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  UserIcon,
  StarIcon,
  CheckIcon,
  XMarkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BookmarkIcon,
  TrophyIcon,
  AcademicCapIcon,
  ViewfinderCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  EyeIcon,
  GlobeAltIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  Square3Stack3DIcon,
  ArrowPathIcon,
  HeartIcon,
  HomeIcon,
  CalculatorIcon,
  BeakerIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon,
  EyeSlashIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string
  strokeWidth?: number | string
}

function wrap(Icon: React.ElementType) {
  return function Wrapped({ size = 24, strokeWidth = 1.5, ...props }: IconProps) {
    return <Icon width={size} height={size} strokeWidth={strokeWidth} {...props} />
  }
}

// Heroicons ships no brand/social icons — these two are hand-drawn in the
// same monoline style (stroke-only, no filled brand mark).
function FacebookIcon({ strokeWidth = 1.5, size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ strokeWidth = 1.5, size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  )
}

export const Facebook = FacebookIcon
export const Instagram = InstagramIcon

export const Flame = wrap(FireIcon)
export const Zap = wrap(BoltIcon)
export const FileText = wrap(DocumentTextIcon)
export const PenLine = wrap(PencilSquareIcon)
export const User = wrap(UserIcon)
export const Star = wrap(StarIcon)
export const Check = wrap(CheckIcon)
export const X = wrap(XMarkIcon)
export const Lock = wrap(LockClosedIcon)
export const Search = wrap(MagnifyingGlassIcon)
export const ChevronRight = wrap(ChevronRightIcon)
export const ChevronLeft = wrap(ChevronLeftIcon)
export const ArrowRight = wrap(ArrowRightIcon)
export const BookOpen = wrap(BookOpenIcon)
export const BookMarked = wrap(BookmarkIcon)
export const Trophy = wrap(TrophyIcon)
export const GraduationCap = wrap(AcademicCapIcon)
export const Target = wrap(ViewfinderCircleIcon)
export const AlertTriangle = wrap(ExclamationTriangleIcon)
export const Lightbulb = wrap(LightBulbIcon)
export const Eye = wrap(EyeIcon)
export const Globe = wrap(GlobeAltIcon)
export const Brain = wrap(SparklesIcon)
export const ListChecks = wrap(ClipboardDocumentCheckIcon)
export const Layers = wrap(Square3Stack3DIcon)
export const RefreshCw = wrap(ArrowPathIcon)
export const Heart = wrap(HeartIcon)
export const Home = wrap(HomeIcon)
export const Calculator = wrap(CalculatorIcon)
export const FlaskConical = wrap(BeakerIcon)
export const Landmark = wrap(BuildingLibraryIcon)
export const Briefcase = wrap(BriefcaseIcon)
export const Cog = wrap(Cog6ToothIcon)
export const TrendingUp = wrap(ArrowTrendingUpIcon)
export const EyeOff = wrap(EyeSlashIcon)
export const Sun = wrap(SunIcon)
export const Moon = wrap(MoonIcon)
