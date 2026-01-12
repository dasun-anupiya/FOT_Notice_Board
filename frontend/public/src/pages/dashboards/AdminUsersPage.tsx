import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usersService } from '@/services/usersService';
import { Plus, Pencil, Trash2, Key, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form States
    const [formData, setFormData] = useState({
        UniversityEmail: '',
        UserType: 'Student',
        Department: 'ICT', // Default
        Password: ''
    });

    const [resetPassword, setResetPassword] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const result = await usersService.getAllUsers();
        if (result.success) {
            // Normalize keys to PascalCase for Consistent UI rendering
            const normalized = result.data.map((u: any) => ({
                ...u, // keep original keys just in case
                UserID: u.UserID || u.userid || u.user_id,
                UniversityEmail: u.UniversityEmail || u.universityemail || u.university_email || u.email,
                UserType: u.UserType || u.usertype || u.user_type,
                Department: u.Department || u.department
            }));
            setUsers(normalized);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!formData.UniversityEmail || !formData.Password) {
            toast.error("Email and Password are required");
            return;
        }

        const result = await usersService.register(formData);
        if (result.success) {
            toast.success("User created successfully");
            setIsCreateOpen(false);
            setFormData({ UniversityEmail: '', UserType: 'Student', Department: 'ICT', Password: '' });
            loadUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleEdit = async () => {
        if (!selectedUser) return;

        const updates = {
            UserType: formData.UserType,
            Department: formData.Department
        };

        const result = await usersService.updateUser(selectedUser.UserID, updates);
        if (result.success) {
            toast.success("User updated successfully");
            setIsEditOpen(false);
            loadUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        const result = await usersService.deleteUser(selectedUser.UserID);
        if (result.success) {
            toast.success("User deleted successfully");
            setIsDeleteOpen(false);
            loadUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !resetPassword) return;

        // The usersService.resetPassword expects { Email, NewPassword } usually used by "Forgot Password" flow
        // Note: Admin might need a specific endpoint or use updateUser if it supports password hashing.
        // Let's check if updateUser supports password. Yes it does.

        const result = await usersService.updateUser(selectedUser.UserID, { Password: resetPassword });

        if (result.success) {
            toast.success("Password reset successfully");
            setIsResetOpen(false);
            setResetPassword('');
        } else {
            toast.error(result.error);
        }
    };

    const openEdit = (user: any) => {
        setSelectedUser(user);
        setFormData({
            UniversityEmail: user.UniversityEmail,
            UserType: user.UserType,
            Department: user.Department || 'ICT',
            Password: '' // Not used in edit
        });
        setIsEditOpen(true);
    };

    const openDelete = (user: any) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const openReset = (user: any) => {
        setSelectedUser(user);
        setResetPassword('');
        setIsResetOpen(true);
    };

    // Filter users
    const filteredUsers = users.filter(user =>
        user.UniversityEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(user.UserID).includes(searchQuery)
    );

    return (
        <AuthenticatedLayout title="Manage Users">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Create, modify, and manage system users.</CardDescription>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>UserID</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.UserID}>
                                            <TableCell>{user.UserID}</TableCell>
                                            <TableCell>{user.UniversityEmail}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.UserType === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.UserType === 'Staff' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.UserType}
                                                </span>
                                            </TableCell>
                                            <TableCell>{user.Department}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => openReset(user)} title="Reset Password">
                                                    <Key className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => openDelete(user)} title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create a new user account.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={formData.UniversityEmail}
                                onChange={e => setFormData({ ...formData, UniversityEmail: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={formData.Password}
                                onChange={e => setFormData({ ...formData, Password: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>User Type</Label>
                                <Select value={formData.UserType} onValueChange={v => setFormData({ ...formData, UserType: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={formData.Department} onValueChange={v => setFormData({ ...formData, Department: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ICT">ICT</SelectItem>
                                        <SelectItem value="ET">ET</SelectItem>
                                        <SelectItem value="BST">BST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Email (Read Only)</Label>
                            <Input value={formData.UniversityEmail} disabled />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>User Type</Label>
                                <Select value={formData.UserType} onValueChange={v => setFormData({ ...formData, UserType: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={formData.Department} onValueChange={v => setFormData({ ...formData, Department: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ICT">ICT</SelectItem>
                                        <SelectItem value="ET">ET</SelectItem>
                                        <SelectItem value="BST">BST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Set a new password for {selectedUser?.UniversityEmail}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={resetPassword}
                                onChange={e => setResetPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} className="bg-orange-600 hover:bg-orange-700">Update Password</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedUser?.UniversityEmail}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
