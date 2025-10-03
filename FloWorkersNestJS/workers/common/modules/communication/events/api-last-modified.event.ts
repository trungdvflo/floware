import { RealTimeEventMetadata } from "./real-time.event";

export interface LastModifiedEventMetadata extends RealTimeEventMetadata {
  api_name: string;
  email: string;
  updated_date: number;
}