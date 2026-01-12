import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { reportsService } from '@/services/reportsService';
import { Loader2, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correct import for autotable
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminReportsPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>({});

    // Load initial summary
    useEffect(() => {
        loadSystemSummary();
    }, []);

    const loadSystemSummary = async () => {
        setLoading(true);
        const result = await reportsService.getSystemSummary();
        if (result.success) setData(prev => ({ ...prev, system: result.data }));
        setLoading(false);
    };

    // Lazy load other tabs
    const handleTabChange = async (value: string) => {
        setLoading(true);
        let result;
        switch (value) {
            case 'users':
                const [usersType, recentUsers, inactiveUsers] = await Promise.all([
                    reportsService.getUsersByType(),
                    reportsService.getRecentUsers(),
                    reportsService.getInactiveUsers()
                ]);
                setData(prev => ({
                    ...prev,
                    usersByType: usersType.data,
                    recentUsers: recentUsers.data,
                    inactiveUsers: inactiveUsers.data
                }));
                break;
            case 'notices':
                const [noticeStats, activeNotices, creatorStats, engagement] = await Promise.all([
                    reportsService.getNoticeStats(),
                    reportsService.getActiveNotices(),
                    reportsService.getNoticesByCreator(),
                    reportsService.getEngagementStats()
                ]);
                setData(prev => ({
                    ...prev,
                    noticeStats: noticeStats.data,
                    activeNotices: activeNotices.data,
                    creatorStats: creatorStats.data,
                    engagement: engagement.data
                }));
                break;
            case 'polls':
                const pollReport = await reportsService.getPollReport();
                setData(prev => ({ ...prev, pollReport: pollReport.data }));
                break;
        }
        setLoading(false);
    };

    const generatePDF = (reportName: string, columns: string[], rows: any[]) => {
        const doc = new jsPDF();
        doc.text(reportName, 14, 15);

        autoTable(doc, {
            head: [columns],
            body: rows,
            startY: 20,
            theme: 'grid'
        });

        doc.save(`${reportName.replace(/\s+/g, '_')}_Report.pdf`);
    };

    // Helper functions to prepare data for PDF
    const prepareUsersByType = () => {
        const rows: any[] = [];
        if (data.usersByType) {
            Object.entries(data.usersByType).forEach(([type, depts]: any) => {
                Object.entries(depts).forEach(([dept, count]: any) => {
                    rows.push([type, dept, count]);
                });
            });
        }
        return rows;
    };

    return (
        <AuthenticatedLayout title="Admin Reports">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Summary Cards */}
                    <SummaryCard title="Total Users" value={data.system?.users || 0} />
                    <SummaryCard title="Total Notices" value={data.system?.notices || 0} />
                    <SummaryCard title="Total Polls" value={data.system?.polls || 0} />
                    <SummaryCard title="Total Responses" value={data.system?.responses || 0} />
                </div>

                <Tabs defaultValue="system" onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="system">System Overview</TabsTrigger>
                        <TabsTrigger value="users">User Reports</TabsTrigger>
                        <TabsTrigger value="notices">Notice Reports</TabsTrigger>
                        <TabsTrigger value="polls">Poll Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="system" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>System Overview</CardTitle>
                                <CardDescription>General system statistics.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Select other tabs for detailed reports.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6 mt-6">
                        {/* Users By Type Table */}
                        <ReportSection
                            title="Users by Type & Department"
                            onDownload={() => generatePDF('Users By Type', ['User Type', 'Department', 'Count'], prepareUsersByType())}
                        >
                            <Table id="tbl-users-type">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Type</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.usersByType && Object.entries(data.usersByType).map(([type, depts]: any) => (
                                        Object.entries(depts).map(([dept, count]: any) => (
                                            <TableRow key={`${type}-${dept}`}>
                                                <TableCell>{type}</TableCell>
                                                <TableCell>{dept}</TableCell>
                                                <TableCell className="text-right">{count}</TableCell>
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>

                        {/* Recent Users */}
                        <ReportSection
                            title="Recently Registered Users"
                            onDownload={() => generatePDF(
                                'Recent Users',
                                ['Email', 'UserID', 'Type', 'Joined'],
                                data.recentUsers?.map((u: any) => [u.UniversityEmail, u.UserID, u.UserType, new Date(u.CreatedTimestamp).toLocaleDateString()]) || []
                            )}
                        >
                            <Table id="tbl-recent-users">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>UserID</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentUsers?.map((u: any) => (
                                        <TableRow key={u.UserID}>
                                            <TableCell>{u.UniversityEmail}</TableCell>
                                            <TableCell>{u.UserID}</TableCell>
                                            <TableCell>{u.UserType}</TableCell>
                                            <TableCell>{new Date(u.CreatedTimestamp).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>

                        {/* Inactive Users */}
                        <ReportSection
                            title="Inactive Users (>90 Days)"
                            onDownload={() => generatePDF(
                                'Inactive Users',
                                ['Email', 'UserID', 'Last Active'],
                                data.inactiveUsers?.map((u: any) => [u.UniversityEmail, u.UserID, new Date(u.LastUpdated).toLocaleDateString()]) || []
                            )}
                        >
                            <Table id="tbl-inactive-users">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>UserID</TableHead>
                                        <TableHead>Last Active</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.inactiveUsers?.map((u: any) => (
                                        <TableRow key={u.UserID}>
                                            <TableCell>{u.UniversityEmail}</TableCell>
                                            <TableCell>{u.UserID}</TableCell>
                                            <TableCell>{new Date(u.LastUpdated).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>
                    </TabsContent>

                    <TabsContent value="notices" className="space-y-6 mt-6">
                        {/* Notice Status */}
                        <ReportSection
                            title="Notices by Status"
                            onDownload={() => generatePDF(
                                'Notice Status',
                                ['Status', 'Count'],
                                data.noticeStats ? Object.entries(data.noticeStats).map(([status, count]: any) => [status, count]) : []
                            )}
                        >
                            <Table id="tbl-notice-status">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.noticeStats && Object.entries(data.noticeStats).map(([status, count]: any) => (
                                        <TableRow key={status}>
                                            <TableCell>{status}</TableCell>
                                            <TableCell className="text-right">{count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>

                        {/* Active Notices */}
                        <ReportSection
                            title="Active Notices"
                            onDownload={() => generatePDF(
                                'Active Notices',
                                ['Title', 'Start Date', 'End Date', 'Audience'],
                                data.activeNotices?.map((n: any) => [n.Title, new Date(n.StartDate).toLocaleDateString(), new Date(n.EndDate).toLocaleDateString(), n.WhoCanSee]) || []
                            )}
                        >
                            <Table id="tbl-active-notices">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Audience</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.activeNotices?.map((n: any) => (
                                        <TableRow key={n.NoticeID}>
                                            <TableCell className="font-medium">{n.Title}</TableCell>
                                            <TableCell>{new Date(n.StartDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(n.EndDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{n.WhoCanSee}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>

                        {/* User Engagement (Top Creators) */}
                        <ReportSection
                            title="Top Notice Creators"
                            onDownload={() => generatePDF(
                                'Top Notice Creators',
                                ['Email', 'Notices Created'],
                                data.creatorStats?.map((c: any) => [c.email, c.count]) || []
                            )}
                        >
                            <Table id="tbl-notice-creators">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Notices Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.creatorStats?.map((c: any) => (
                                        <TableRow key={c.email}>
                                            <TableCell>{c.email}</TableCell>
                                            <TableCell className="text-right">{c.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>
                    </TabsContent>

                    <TabsContent value="polls" className="space-y-6 mt-6">
                        <ReportSection
                            title="Poll Participation"
                            onDownload={() => generatePDF(
                                'Poll Participation',
                                ['Poll Question', 'Responses'],
                                data.pollReport?.participation?.map((p: any) => [p.question, p.responses]) || []
                            )}
                        >
                            <Table id="tbl-poll-participation">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Poll Question</TableHead>
                                        <TableHead className="text-right">Responses</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.pollReport?.participation?.map((p: any) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.question}</TableCell>
                                            <TableCell className="text-right">{p.responses}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>

                        <ReportSection
                            title="Poll Status Overview"
                            onDownload={() => generatePDF(
                                'Poll Status',
                                ['Status', 'Count'],
                                data.pollReport?.status ? Object.entries(data.pollReport.status).map(([status, count]: any) => [status, count]) : []
                            )}
                        >
                            <Table id="tbl-poll-status">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.pollReport?.status && Object.entries(data.pollReport.status).map(([status, count]: any) => (
                                        <TableRow key={status}>
                                            <TableCell>{status}</TableCell>
                                            <TableCell className="text-right">{count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ReportSection>
                    </TabsContent>
                </Tabs>
            </div>
        </AuthenticatedLayout>
    );
}

const SummaryCard = ({ title, value }: { title: string, value: number }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const ReportSection = ({ title, children, onDownload }: any) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);
