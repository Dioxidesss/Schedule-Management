export type AppointmentStatus =
    | 'scheduled'
    | 'yard_queue'
    | 'unloading'
    | 'completed'
    | 'delayed';

export type LoadType = 'palletized' | 'floor-loaded';

export interface Appointment {
    id: string;
    po_number: string;
    carrier_name: string;
    scheduled_start: string; // ISO 8601
    scheduled_end?: string;
    actual_start?: string;
    actual_end?: string;
    door_id?: string;
    status: AppointmentStatus;
    load_type: LoadType;
    estimated_duration_min?: number;
}
