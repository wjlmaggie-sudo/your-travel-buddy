/** These providers return property-level prices, not a named room or bed configuration. */
export function HotelRoomFacts() {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-xs">
      <p>
        <span className="font-medium">Room type & beds:</span> Not specified by the provider.
      </p>
      <p className="mt-1 text-muted-foreground">
        Confirm the exact room category, bed layout and guest capacity before booking. The suggested
        setup above is planning advice, not a guaranteed room included in this price.
      </p>
    </div>
  );
}
