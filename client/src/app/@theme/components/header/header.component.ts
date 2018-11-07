import { Component, Input, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { LayoutService } from '../../../@core/data/layout.service';
import { UploadImageModalComponent } from './upload-image-modal/upload-image-modal.component';
import {ToasterConfig, ToasterService, Toast, BodyOutputType} from 'angular2-toaster';
import {TrashQueryService} from '../../../@core/data/trash-query.service';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {

  @Input() position = 'normal';
  config: ToasterConfig;

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private layoutService: LayoutService,
              private modalService: NgbModal,
              private toasterService: ToasterService, private trashQueryService: TrashQueryService) {
  }

  ngOnInit() {}

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  toggleSettings(): boolean {
    this.sidebarService.toggle(false, 'settings-sidebar');

    return false;
  }

  goToHome() {
    this.menuService.navigateHome();
  }

  goToUploadImage() {
    this.modalService.open(UploadImageModalComponent, { size: 'lg', container: 'nb-layout' })
      .result.then((result) => {
      if (result) {
        this.showToast('Photo submitted', 'We\'ll let you know when it\'s done processing.');
        this.trashQueryService.submitImage(result).subscribe(res => {
          this.showToast('Done processing!', 'Data is now available.');
        }, error => {
        });
      }
    });
  }

  showToast(title: string, body: string) {
    this.config = new ToasterConfig({
      positionClass: 'toast-top-right',
      timeout: 5000,
      newestOnTop: true,
      tapToDismiss: true,
      preventDuplicates: true,
      animation: 'fade',
      limit: 1,
    });
    const toast: Toast = {
      type: 'default',
      title: title,
      body: body,
      timeout: 5000,
      showCloseButton: false,
      bodyOutputType: BodyOutputType.TrustedHtml,
    };
    this.toasterService.popAsync(toast);
  }
}
