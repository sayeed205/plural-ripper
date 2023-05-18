# Plural Ripper

Plural Ripper is a command-line tool that allows you to download course videos from Pluralsight.com. It provides an interactive interface to prompt for the necessary information and automate the download process.

## Installation

You can install Plural Ripper globally using npm:

```shell
npm install -g plural-ripper
```

Alternatively, you can use `npx` to run the tool without installing it globally:

```shell
npx plural-ripper
```

![](https://i.imgur.com/5ZQ3Z3M.png)

## Usage

To use Plural Ripper, follow these steps:

1. Log in to your Pluralsight account on the Pluralsight website.
2. Navigate to the course page you want to download. The URL of the page should contain "table-of-contents".
3. Open the developer tools in your browser. (Press F12 or Ctrl+Shift+I or right-click and select "Inspect")
4. Go to the "Console" tab in the developer tools.
5. Copy the entire code from the [`getCourseDetails.js`](https://github.com/sayeed205/plural-ripper/blob/master/src/utils/getCourseDetails.js) file provided in this repository.
6. Paste the code into the console and press Enter to execute it.
7. Wait for the script to generate a JSON file containing the course details. The file will be downloaded automatically.
8. Run the Plural Ripper CLI tool by executing the following command:

```shell
plural-ripper
```

9. The tool will prompt you to enter the path to the downloaded JSON file.
10. After providing the JSON file path, the tool will prompt you to enter the output directory path where the course videos will be downloaded.
11. Once you provide the necessary information, the tool will start downloading the course videos to the specified directory.
12. Sit back and relax while the tool handles the downloading process for you.

Note: Make sure you have a stable internet connection during the download process.

## To-Do

-   [x] Add support for downloading videos.
-   [ ] Add support for downloading course subtitles.
-   [ ] Add support for downloading course exercise files.
-   [ ] Add support for a executable binary file so no need to use nodejs to run the tool. (Help needed)
-   [ ] Add end to end tests. (Help needed)

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/sayeed205/plural-ripper).

## License

This project is licensed under the [MIT License](LICENSE).

## Disclaimer

This tool is developed for educational purposes only. Use it responsibly and respect the terms of use and copyright restrictions of Pluralsight.com.

## Acknowledgements

This tool is inspired by the need to easily download course videos from Pluralsight.com for offline viewing and personal use. Special thanks to the developers of Pluralsight for providing valuable learning resources.

## Contact

For any inquiries or questions, feel free to reach out to me at sayeed205@gmail.com.

Happy learning and happy downloading!
