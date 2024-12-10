export interface PublishNewsletterRequest {
    title: string;
    content: {
        html: string;
        text: string;
    };
}
