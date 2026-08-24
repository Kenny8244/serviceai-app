import React, { useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/layout/PageShell';

interface Asset {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DAMAGED' | 'MAINTENANCE' | 'LOST';
  serialNumber: string;
  manufacturer: string;
  model: string;
  modelId: string;
  location: string;
  lastSeen: string;
  warrantyContract: string;
  warrantyExpiration: string;
  category: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
  children?: Category[];
}

const AssetsPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with API calls
  const categories: Category[] = [
    {
      id: 'it-hardware',
      name: 'IT Hardware',
      count: 0,
      children: [
        { id: 'laptops', name: 'Laptops', count: 36 },
        { id: 'monitors', name: 'Monitors', count: 24 },
        { id: 'phones', name: 'Phones', count: 15 },
      ],
    },
    {
      id: 'office-assets',
      name: 'Office assets',
      count: 0,
      children: [
        { id: 'desk-chairs', name: 'Desk chairs', count: 12 },
      ],
    },
  ];

  // Mock assets data
  const assets: Asset[] = [
    {
      id: 'LTMB022101',
      name: 'LTMB022101',
      status: 'DAMAGED',
      serialNumber: 'C03C28IKLVDN',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16-inch (2019)',
      modelId: 'MacBook Pro MNQG2LL',
      location: 'Home office - US',
      lastSeen: '2025-12-15',
      warrantyContract: 'Extended Warranty Services - MacBook',
      warrantyExpiration: '2024-12-31',
      category: 'it-hardware',
      type: 'laptops',
    },
    // Add more mock assets as needed
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'DAMAGED':
        return 'destructive';
      case 'MAINTENANCE':
        return 'secondary';
      case 'LOST':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return [asset.id, asset.name, asset.model, asset.manufacturer, asset.serialNumber]
      .some((value) => value.toLowerCase().includes(query))
  })

  const renderCategoryTree = (category: Category, level = 0) => (
    <div key={category.id} className="mb-1">
      <div 
        className={`flex items-center py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${level === 0 ? 'font-medium' : 'pl-6'}`}
      >
        <span className="flex-1">{category.name}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{category.count}</span>
      </div>
      {category.children?.map(child => renderCategoryTree(child, level + 1))}
    </div>
  );

  return (
    <PageShell
      flush
      title="Objects"
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search assets..."
              className="pl-8 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button disabled title="Coming soon">
            <Plus className="mr-2 h-4 w-4" />
            Create Object
          </Button>
        </>
      }
    >
    <div className="flex flex-1 min-h-0 bg-slate-50 dark:bg-slate-900">
      {/* Schema Tree Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-4">Schema Tree</h2>
        <div className="space-y-1">
          {categories.map(category => renderCategoryTree(category))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Asset List */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No assets match this search.
                </div>
              ) : (
                filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className={`p-3 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    selectedAsset?.id === asset.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                  }`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{asset.id}</span>
                    <Badge variant={getStatusBadgeVariant(asset.status)}>
                      {asset.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{asset.model}</p>
                </div>
              ))
              )}
            </div>
          </div>

          {/* Asset Details */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
            {selectedAsset ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                    <div className="flex items-center mt-2">
                      <Badge variant={getStatusBadgeVariant(selectedAsset.status)}>
                        {selectedAsset.status}
                      </Badge>
                    </div>
                  </div>

                  <Card className="p-6">
                    <h3 className="font-medium mb-4">Details</h3>
                    <div className="space-y-4">
                      <DetailItem label="Serial Number" value={selectedAsset.serialNumber} />
                      <DetailItem label="Manufacturer" value={selectedAsset.manufacturer} />
                      <DetailItem label="Model" value={selectedAsset.model} />
                      <DetailItem label="Model ID" value={selectedAsset.modelId} />
                      <DetailItem label="Location" value={selectedAsset.location} />
                      <DetailItem label="Last Seen" value={selectedAsset.lastSeen} />
                      <DetailItem label="Warranty Contract" value={selectedAsset.warrantyContract} />
                      <DetailItem 
                        label="Warranty expiration date" 
                        value={new Date(selectedAsset.warrantyExpiration).toLocaleDateString()}
                      />
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-medium mb-4">Avatar</h3>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center mb-2">
                          <span className="text-slate-400">Image</span>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          Change
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-medium mb-4">Linked objects</h3>
                    <div className="space-y-4">
                      <div>
                            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Outbound references</h4>
                            <div className="space-y-2">
                              <div className="text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Located at:</span>{' '}
                                <span className="font-medium">{selectedAsset.location}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Model type of:</span>{' '}
                                <span className="font-medium">{selectedAsset.model}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Financial:</span>{' '}
                                <span className="font-medium">{selectedAsset.warrantyContract}</span>
                              </div>
                            </div>
                          </div>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Package className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No asset selected</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select an asset from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PageShell>
  );
};

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => (
  <div className="grid grid-cols-3 gap-4">
    <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    <div className="col-span-2 text-sm font-medium">{value || '-'}</div>
  </div>
);

export default AssetsPage;
