import { ReleaseApproval } from "azure-devops-extension-api/Release";

export interface IReleaseApproval extends ReleaseApproval {
    definition: HTMLElement;
    number: string;
    environment: string;
}