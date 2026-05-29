import * as Print from "expo-print";

import * as Sharing from "expo-sharing";

export const downloadReportPdf =
    async ({
        reportRows,
        summary,
        selectedClass,
        selectedMonth,
        selectedYear,
    }: any) => {
        const rowsHtml =
            reportRows
                .map(
                    (
                        item: any
                    ) => `
            <tr>
                <td>${item.studentName}</td>
                <td>${item.className}</td>
                <td>₹${item.monthlyFee}</td>
                <td>₹${item.paid}</td>
                <td>₹${item.pending}</td>
                <td>${item.status}</td>
            </tr>
        `
                )
                .join("");

        const html = `
        <html>
        <body
            style="
                font-family: Arial;
                padding: 24px;
            "
        >
            <h1>
                School ERP Report
            </h1>

            <p>
                Class:
                ${selectedClass}
            </p>

            <p>
                Month:
                ${selectedMonth}/${selectedYear}
            </p>

            <hr />

            <h2>
                Summary
            </h2>

            <p>
                Total Students:
                ${summary.totalStudents}
            </p>

            <p>
                Total Collection:
                ₹${summary.totalCollection}
            </p>

            <p>
                Total Pending:
                ₹${summary.totalPending}
            </p>

            <p>
                Defaulters:
                ${summary.defaultersCount}
            </p>

            <br />

            <h2>
                Student Report
            </h2>

            <table
                width="100%"
                border="1"
                cellspacing="0"
                cellpadding="8"
            >
                <tr>
                    <th>
                        Student
                    </th>

                    <th>
                        Class
                    </th>

                    <th>
                        Fee
                    </th>

                    <th>
                        Paid
                    </th>

                    <th>
                        Pending
                    </th>

                    <th>
                        Status
                    </th>
                </tr>

                ${rowsHtml}
            </table>
        </body>
        </html>
        `;

        const { uri } =
            await Print.printToFileAsync(
                {
                    html,
                }
            );

        await Sharing.shareAsync(
            uri
        );
    };