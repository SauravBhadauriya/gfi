export function convertDateToDaysLeft(date: string | any) {
  if (typeof date !== "string") {
    return date;
  }
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    return date;
  }
  const today = new Date();
  const differenceInMs = targetDate.getTime() - today.getTime();
  if (differenceInMs <= 0) {
    return 0;
  }
  const msInADay = 1000 * 60 * 60 * 24;
  return Math.ceil(differenceInMs / msInADay);
}
