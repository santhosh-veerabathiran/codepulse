import { Type } from '@angular/core';

export interface NavItem {
    id: string;
    label: string;
    icon: string;
    color: string;
    teamOnly?: boolean;
    component: Type<unknown>;
}
