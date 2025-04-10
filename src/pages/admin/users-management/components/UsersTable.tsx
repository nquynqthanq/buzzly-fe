import React, { useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Pagination,
    Typography,
    Avatar,
} from '@mui/material';
import { Search, MoreVert } from '@mui/icons-material';
import { IUser } from '../../../../types/user';

interface UsersTableProps {
    users: IUser[];
}

const UsersTable = ({ users = [] }: UsersTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState('all');
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    const filteredUsers = users
        .filter((user) => {
            if (filterGender === 'all') return true;
            return user.gender.toLowerCase() === filterGender.toLowerCase();
        })
        .filter((user) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower)
            );
        });

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    return (
        <Box sx={{ width: '100%', mt: 4 }}>
            {/* Thanh điều khiển: Bộ lọc, Tìm kiếm, Nút Add new */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mb: 2,
                gap: 2,
            }}>
                {/* Bộ lọc theo Gender */}
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel
                        sx={{
                            color: 'gray.500',
                            '&.Mui-focused': {
                                color: 'dark.500',
                            },
                        }}
                    >
                        Filter by Gender
                    </InputLabel>
                    <Select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value as string)}
                        label="Filter by Gender"
                        sx={{
                            '& .MuiSelect-select': {
                                padding: '12px 20px 8px 20px',
                                fontSize: 16,
                            },
                            '& .MuiInputBase-root': {
                                padding: '0px',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'gray.200',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'gray.400',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'dark.500',
                                borderWidth: 1,
                            },
                        }}
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    '& .MuiMenuItem-root': {
                                        fontSize: 16,
                                    },
                                },
                            },
                        }}
                    >
                        <MenuItem value="all">All Users</MenuItem>
                        <MenuItem value="male">Male Users</MenuItem>
                        <MenuItem value="female">Female Users</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                    </Select>

                </FormControl>

                <TextField
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        flex: 1,
                        maxWidth: { xs: '100%', md: 300 },
                        '& .MuiInputBase-root': {
                            padding: '10px 20px 10px 8px',
                            fontSize: 16,
                        },
                        '& .MuiInputBase-input': {
                            padding: '2px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'gray.200',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'gray.400',
                        },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'dark.500',
                            borderWidth: 1,
                        },
                    }}
                />
            </Box>

            {/* Bảng người dùng */}
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 600, width: '10%' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, minWidth: '200px' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '10%' }}>Gender</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '10%' }}>Nationality</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '10%' }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '10%' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '5%' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user, index) => (
                                <TableRow key={index}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar
                                                src={user.avatar || ''}
                                                alt={user.name}
                                                sx={{ width: 32, height: 32 }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {user.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.gender}</TableCell>
                                    <TableCell>{user.nationality}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: user.isShowReview ? '#4caf50' : '#bdbdbd',
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {user.isShowReview ? 'Active' : 'Inactive'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton>
                                            <MoreVert />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        No users found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Phân trang */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        siblingCount={1}
                        boundaryCount={1}
                        showFirstButton
                        showLastButton
                        shape="rounded"
                        sx={{
                            '& .MuiPaginationItem-root': {
                                fontSize: '14px',
                            },
                            '& .Mui-selected': {
                                bgcolor: '#000',
                                color: '#fff',
                                '&:hover': { bgcolor: '#333' },
                            },
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default UsersTable;