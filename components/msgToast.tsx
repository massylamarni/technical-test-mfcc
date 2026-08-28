import { Item, ItemContent, ItemMedia, ItemTitle } from "./ui/item";
import { Spinner } from "./ui/spinner";

export default function MsgToast({ msg }: { msg: string }) {
  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
      <Item variant="muted">
        <ItemMedia>
          <Spinner />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">{msg}</ItemTitle>
        </ItemContent>
      </Item>
    </div>
  );
}
