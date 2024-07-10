import { FormMessage } from './contact';

interface ResponseData {
    status: string;
    message: string;
}

interface RequestContact {
    message: string;
}

interface FormWorkerData {
    data: FormMessage;
    target: string;
}
