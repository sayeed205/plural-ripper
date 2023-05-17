export interface Clip {
    title: string;
    url: string;
}

export interface Module {
    title: string;
    clips: Clip[];
}

export interface Course {
    courseTitle: string;
    courseName: string;
    courseAuthors: string;
    modules: Module[];
    lastUpdated: string;
}
