import React from 'react';
import { Button } from '../ui/button';
import { Upload as UploadIcon, Loader2, Download } from 'lucide-react';

const ProductHeader = ({ onImportClick, onExportClick, importLoading, fileInputRef }) => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Product Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage your catalog and inventory</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              ref={fileInputRef}
              id="excelFileImport"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onImportClick}
              className="sr-only"
              disabled={importLoading}
            />
            <Button
              onClick={() => {
                if (fileInputRef?.current && !importLoading) {
                  fileInputRef.current.click();
                }
              }}
              variant="outline"
              className="h-8 sm:h-9 px-2 sm:px-3 border-gray-300 hover:bg-gray-100 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
              disabled={importLoading}
            >
              {importLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Importing...</span>
                  <span className="sm:hidden">Importing</span>
                </>
              ) : (
                <>
                  <UploadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Import</span>
                  <span className="sm:hidden">Import</span>
                </>
              )}
            </Button>
          </div>
          <Button
            onClick={onExportClick}
            variant="outline"
            className="h-8 sm:h-9 px-2 sm:px-3 border-gray-300 hover:bg-gray-100 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;

