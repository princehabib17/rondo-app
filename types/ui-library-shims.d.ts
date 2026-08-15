/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "lucide-react" {
  import type { FC, SVGProps } from "react";

  export type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string }>;
  export const Activity: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowDownLeft: LucideIcon;
  export const ArrowDownToLine: LucideIcon;
  export const ArrowDownUp: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const BadgeCheck: LucideIcon;
  export const Bell: LucideIcon;
  export const Bookmark: LucideIcon;
  export const Building2: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronRightIcon: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const CircleCheckIcon: LucideIcon;
  export const CircleDollarSign: LucideIcon;
  export const CirclePlus: LucideIcon;
  export const Clapperboard: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Clock: LucideIcon;
  export const Clock3: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Download: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Filter: LucideIcon;
  export const Heart: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Home: LucideIcon;
  export const ImagePlus: LucideIcon;
  export const InfoIcon: LucideIcon;
  export const LifeBuoy: LucideIcon;
  export const Link2: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Loader2: LucideIcon;
  export const Loader2Icon: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Map: LucideIcon;
  export const MapPin: LucideIcon;
  export const MapPinned: LucideIcon;
  export const Megaphone: LucideIcon;
  export const Menu: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const OctagonXIcon: LucideIcon;
  export const Pause: LucideIcon;
  export const Phone: LucideIcon;
  export const Play: LucideIcon;
  export const Plus: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const Radio: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const Share2: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ScanFace: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Star: LucideIcon;
  export const Timer: LucideIcon;
  export const Trash2: LucideIcon;
  export const TriangleAlertIcon: LucideIcon;
  export const Trophy: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const UserMinus: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserRound: LucideIcon;
  export const UserSearch: LucideIcon;
  export const Users: LucideIcon;
  export const Users2: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const Wallet: LucideIcon;
  export const X: LucideIcon;
  export const XIcon: LucideIcon;
  export const Zap: LucideIcon;
}

declare module "@base-ui/react/avatar" {
  import type { ComponentProps, FC } from "react";

  export namespace Avatar {
    namespace Root { type Props = ComponentProps<"span">; }
    namespace Image { type Props = ComponentProps<"img">; }
    namespace Fallback { type Props = ComponentProps<"span">; }
  }
  export const Avatar: {
    Root: FC<Avatar.Root.Props>;
    Image: FC<Avatar.Image.Props>;
    Fallback: FC<Avatar.Fallback.Props>;
  };
}

declare module "@base-ui/react/button" {
  import type { ComponentProps, FC, ReactNode } from "react";

  export namespace Button {
    type Props = ComponentProps<"button"> & { render?: ReactNode };
  }
  export const Button: FC<Button.Props>;
}

declare module "@base-ui/react/dialog" {
  import type { ComponentProps, FC, ReactNode } from "react";

  type RenderProp = { render?: ReactNode };
  export namespace Dialog {
    namespace Root { type Props = { children?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }; }
    namespace Trigger { type Props = ComponentProps<"button"> & RenderProp; }
    namespace Portal { type Props = { children?: ReactNode }; }
    namespace Close { type Props = ComponentProps<"button"> & RenderProp; }
    namespace Backdrop { type Props = ComponentProps<"div">; }
    namespace Popup { type Props = ComponentProps<"div">; }
    namespace Title { type Props = ComponentProps<"h2">; }
    namespace Description { type Props = ComponentProps<"p">; }
  }
  export const Dialog: {
    Root: FC<Dialog.Root.Props>;
    Trigger: FC<Dialog.Trigger.Props>;
    Portal: FC<Dialog.Portal.Props>;
    Close: FC<Dialog.Close.Props>;
    Backdrop: FC<Dialog.Backdrop.Props>;
    Popup: FC<Dialog.Popup.Props>;
    Title: FC<Dialog.Title.Props>;
    Description: FC<Dialog.Description.Props>;
  };
}

declare module "@base-ui/react/input" {
  import type { ComponentProps, FC } from "react";

  export namespace Input {
    type Props = ComponentProps<"input">;
  }
  export const Input: FC<Input.Props>;
}

declare module "@base-ui/react/menu" {
  import type { ComponentProps, FC, ReactNode } from "react";

  type RenderProp = { render?: ReactNode };
  export namespace Menu {
    namespace Root { type Props = { children?: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }; }
    namespace Trigger { type Props = ComponentProps<"button"> & RenderProp; }
    namespace Portal { type Props = { children?: ReactNode }; }
    namespace Positioner { type Props = ComponentProps<"div"> & { align?: "start" | "center" | "end"; alignOffset?: number; side?: "top" | "right" | "bottom" | "left"; sideOffset?: number }; }
    namespace Popup { type Props = ComponentProps<"div">; }
    namespace Group { type Props = ComponentProps<"div">; }
    namespace GroupLabel { type Props = ComponentProps<"div">; }
    namespace Item { type Props = ComponentProps<"div"> & RenderProp; }
    namespace CheckboxItem { type Props = ComponentProps<"div"> & { checked?: boolean; disabled?: boolean }; }
    namespace CheckboxItemIndicator { type Props = { children?: ReactNode }; }
    namespace RadioGroup { type Props = ComponentProps<"div"> & { value?: string; onValueChange?: (value: string) => void }; }
    namespace RadioItem { type Props = ComponentProps<"div"> & { value?: string; disabled?: boolean }; }
    namespace RadioItemIndicator { type Props = { children?: ReactNode }; }
    namespace Separator { type Props = ComponentProps<"div">; }
    namespace SubmenuRoot { type Props = { children?: ReactNode }; }
    namespace SubmenuTrigger { type Props = ComponentProps<"div"> & RenderProp; }
    namespace SubmenuPortal { type Props = { children?: ReactNode }; }
    namespace SubmenuPositioner { type Props = ComponentProps<"div">; }
    namespace SubmenuPopup { type Props = ComponentProps<"div">; }
  }
  export const Menu: {
    Root: FC<Menu.Root.Props>;
    Trigger: FC<Menu.Trigger.Props>;
    Portal: FC<Menu.Portal.Props>;
    Positioner: FC<Menu.Positioner.Props>;
    Popup: FC<Menu.Popup.Props>;
    Group: FC<Menu.Group.Props>;
    GroupLabel: FC<Menu.GroupLabel.Props>;
    Item: FC<Menu.Item.Props>;
    CheckboxItem: FC<Menu.CheckboxItem.Props>;
    CheckboxItemIndicator: FC<Menu.CheckboxItemIndicator.Props>;
    RadioGroup: FC<Menu.RadioGroup.Props>;
    RadioItem: FC<Menu.RadioItem.Props>;
    RadioItemIndicator: FC<Menu.RadioItemIndicator.Props>;
    Separator: FC<Menu.Separator.Props>;
    SubmenuRoot: FC<Menu.SubmenuRoot.Props>;
    SubmenuTrigger: FC<Menu.SubmenuTrigger.Props>;
    SubmenuPortal: FC<Menu.SubmenuPortal.Props>;
    SubmenuPositioner: FC<Menu.SubmenuPositioner.Props>;
    SubmenuPopup: FC<Menu.SubmenuPopup.Props>;
  };
}

declare module "@base-ui/react/merge-props" {
  import type { ComponentProps } from "react";

  export function mergeProps<T extends keyof HTMLElementTagNameMap>(
    ...args: Array<Partial<ComponentProps<T>>>
  ): ComponentProps<T>;
}

declare module "@base-ui/react/progress" {
  import type { ComponentProps, FC } from "react";

  export namespace Progress {
    namespace Root { type Props = ComponentProps<"div"> & { value?: number | null; max?: number }; }
    namespace Track { type Props = ComponentProps<"div">; }
    namespace Indicator { type Props = ComponentProps<"div">; }
    namespace Label { type Props = ComponentProps<"div">; }
    namespace Value { type Props = ComponentProps<"div">; }
  }
  export const Progress: {
    Root: FC<Progress.Root.Props>;
    Track: FC<Progress.Track.Props>;
    Indicator: FC<Progress.Indicator.Props>;
    Label: FC<Progress.Label.Props>;
    Value: FC<Progress.Value.Props>;
  };
}

declare module "@base-ui/react/separator" {
  import type { ComponentProps, FC } from "react";

  export namespace Separator {
    type Props = ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" };
  }
  export const Separator: FC<Separator.Props>;
}

declare module "@base-ui/react/tabs" {
  import type { ComponentProps, FC, ReactNode } from "react";

  export namespace Tabs {
    namespace Root { type Props = ComponentProps<"div"> & { orientation?: "horizontal" | "vertical"; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }; }
    namespace List { type Props = ComponentProps<"div">; }
    namespace Tab { type Props = ComponentProps<"button"> & { value?: string }; }
    namespace Panel { type Props = ComponentProps<"div"> & { value?: string; children?: ReactNode }; }
  }
  export const Tabs: {
    Root: FC<Tabs.Root.Props>;
    List: FC<Tabs.List.Props>;
    Tab: FC<Tabs.Tab.Props>;
    Panel: FC<Tabs.Panel.Props>;
  };
}

declare module "@base-ui/react/use-render" {
  import type { ComponentProps as ReactComponentProps, ReactNode } from "react";

  export namespace useRender {
    type ComponentProps<T extends keyof HTMLElementTagNameMap> = ReactComponentProps<T> & {
      render?: ReactNode;
    };
  }
  export function useRender(params: any): any;
}
