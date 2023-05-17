const getClipUrl = async clipId => {
    try {
        return fetch('https://app.pluralsight.com/video/clips/v3/viewclip', {
            method: 'POST',
            headers: {
                'X-Team': 'video-service',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clipId,
                boundedContext: 'course',
                mediaType: 'mp4',
                online: true,
                quality: '1280x720',
                versionId: '',
            }),
        }).then(res => res.json().then(res => res.urls[0].url));
    } catch (error) {
        throw error;
    }
};

(async function () {
    let url = window.location.href;
    if (!url.includes('table-of-contents'))
        throw new Error('This is not a course page');
    const courseName = url.split('/')[url.split('/').length - 2];

    url = `https://app.pluralsight.com/learner/content/courses/${courseName}`;

    const res = await fetch(url);
    const resJson = await res.json();
    const courseAuthors = resJson?.authors
        ?.map(author => author.displayName)
        .join(', ');
    const courseTitle = resJson?.title;
    const lastUpdated = resJson?.updatedOn;
    const modules = [];

    for (const module of resJson?.modules) {
        const clips = [];
        for (const clip of module?.clips) {
            const title = clip?.title;
            const clipId = clip?.clipId;
            const url = await getClipUrl(clipId);
            clips.push({
                title,
                url,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        modules.push({
            title: module?.title,
            clips,
        });
    }

    const courseData = {
        courseName,
        courseTitle,
        courseAuthors,
        lastUpdated,
        modules,
    };
    const a = document.createElement('a');
    const blob = new Blob([JSON.stringify(courseData, null, 2)], {
        type: 'application/json',
    });
    a.href = URL.createObjectURL(blob);
    a.download = `${courseName}.json`;
    a.click();
})();
