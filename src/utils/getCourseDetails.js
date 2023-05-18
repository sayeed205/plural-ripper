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

    for (let i = 0; i < resJson?.modules.length; i++) {
        const module = resJson.modules[i];
        const clips = [];
        for (let j = 0; j < module?.clips.length; j++) {
            const clip = module.clips[j];
            const title = clip?.title;
            const clipId = clip?.clipId;
            const url = await getClipUrl(clipId);
            clips.push({
                title,
                url,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Log the number of items left in the loop
            console.log(`Items left: ${module.clips.length - j - 1}`);
        }

        modules.push({
            title: module?.title,
            clips,
        });

        // Log the number of items left in the loop
        console.log(`Modules left: ${resJson.modules.length - i - 1}`);
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
