export type IntegrationCreds = {
    version: string;        // e.g. v20.0
    wabaId: string;
    phoneNumberId: string;
    token: string;          // Permanent System User token
    verifyToken?: string;   // webhook verify token
    displayName?: string;
};

export type TemplateComponent = {
    type: "header" | "body" | "button";
    sub_type?: "quick_reply" | "url";
    parameters?: Array<
        | { type: "text"; text: string }
        | { type: "currency"; currency: { fallback_value: string; code: string; amount_1000: number } }
        | { type: "date_time"; date_time: { fallback_value: string } }
        | { type: "document"; document: { link?: string; id?: string; filename?: string } }
        | { type: "image"; image: { link?: string; id?: string } }
        | { type: "video"; video: { link?: string; id?: string } }
    >;
};
