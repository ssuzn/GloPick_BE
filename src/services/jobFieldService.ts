import { JOB_FIELDS } from "../constants/dropdownOptions";
import { ISCOJobField } from "../types/countryRecommendation";

export const toJobCode = (desiredJob: string): string =>
  desiredJob.replace("JOB_", "");

export const findJobFieldByCode = (
  code: string,
): ISCOJobField => {
  return (
    JOB_FIELDS.find((field) => field.code === code) ??
    JOB_FIELDS[1]
  );
};