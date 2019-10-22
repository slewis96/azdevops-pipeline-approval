import * as SDK from "azure-devops-extension-sdk";
import { ReleaseRestClient, ApprovalStatus } from "azure-devops-extension-api/Release";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";
import { IReleaseApproval } from "@src-root/hub/model/IReleaseApproval";

export class ReleaseApprovalService {

    constructor() { 
        SDK.init();
    }

    async listAll(top: number = 50): Promise<IReleaseApproval[]> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        const orgname =SDK.getHost().name;
        const projname = project!.name;
        const projecturl = await "https://dev.azure.com/"+orgname+"/"+projname;
        const user = await SDK.getUser();

        if (!project) return [];
        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        let approvals = await client.getApprovals(project.name, user.name, undefined, undefined, undefined, top, undefined, undefined, true);
        return approvals.map(a => {
            const relurl = projecturl + "/_releaseProgress?releaseId="+a.release.id;
            var appType = a.approvalType == 1 ? " (Pre)" : " (Post)";
            var element = document.createElement('a');
            element.setAttribute('href', relurl);
            element.innerHTML = a.releaseDefinition.name;
            return {
                definition: element,
                number: a.release.name,
                environment: a.releaseEnvironment.name + appType,
                ...a
            }
        });
    }

    private async changeStatus(approval: IReleaseApproval, approvalStatus: ApprovalStatus, comment: string): Promise<void> {
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        if (!project) return;

        let client: ReleaseRestClient = getClient(ReleaseRestClient);
        approval.status = approvalStatus;
        approval.comments = comment;
        await client.updateReleaseApproval(approval, project.name, approval.id);
    }

    async approveAll(approvals: IReleaseApproval[], comment: string): Promise<void> {
        await approvals.forEach(async (approval: IReleaseApproval, index: number) => 
            await this.approve(approval, comment));
    }

    async approve(approval: IReleaseApproval, comment: string): Promise<void> {
        await this.changeStatus(approval, ApprovalStatus.Approved, comment);
    }

    async rejectAll(approvals: IReleaseApproval[], comment: string): Promise<void> {
        await approvals.forEach(async (approval: IReleaseApproval, index: number) => 
            await this.reject(approval, comment));
    }

    async reject(approval: IReleaseApproval, comment: string): Promise<void> {
        await this.changeStatus(approval, ApprovalStatus.Rejected, comment);
    }
}